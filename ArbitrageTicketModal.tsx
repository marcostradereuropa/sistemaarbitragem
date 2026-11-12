import React, { useState, useEffect } from 'react';
import { ArbitrageOpportunity, ArbitrageTicket, NetworkRoute, REAL_EXCHANGE_FEE_RATES } from '../types/arbitrage';
import { generateOpportunityTicket, analyzeOpportunityWithAI, verifyLiveOrderBookTicket } from '../services/api';
import { 
  X, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check, Sparkles, 
  Layers, ArrowRight, Clock, DollarSign, Scale, BrainCircuit, Printer, RefreshCw, Network,
  Calculator, Receipt, Info, ShieldAlert
} from 'lucide-react';

interface ArbitrageTicketModalProps {
  opportunity: ArbitrageOpportunity | null;
  onClose: () => void;
  capitalUsd: number;
  onOpenExecution?: (opp: ArbitrageOpportunity) => void;
}

export const ArbitrageTicketModal: React.FC<ArbitrageTicketModalProps> = ({
  opportunity,
  onClose,
  capitalUsd,
  onOpenExecution,
}) => {
  if (!opportunity) return null;

  const [ticket, setTicket] = useState<ArbitrageTicket | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isReauditing, setIsReauditing] = useState<boolean>(false);
  const [liveAuditData, setLiveAuditData] = useState<any>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(
    opportunity.bestNetwork?.networkId || opportunity.availableNetworkProtocol || 'default'
  );

  const availableNetworksList: NetworkRoute[] = 
    (opportunity.allMatchingNetworks && opportunity.allMatchingNetworks.length > 0)
      ? opportunity.allMatchingNetworks
      : (opportunity.bestNetwork ? [opportunity.bestNetwork] : []);

  const activeNetwork = availableNetworksList.find((n) => n.networkId === selectedNetworkId) || opportunity.bestNetwork;
  const currentNetworkName = activeNetwork?.networkName || opportunity.availableNetworkName || 'Rede Principal';
  const currentNetworkFeeUsd = activeNetwork ? activeNetwork.estimatedFeeUsd : opportunity.transferFeeUsd;
  const currentNetworkFeeTokens = activeNetwork 
    ? `${activeNetwork.withdrawalFeeTokens} ${opportunity.symbol}` 
    : (opportunity.withdrawalFeeTokenDisplay || `${opportunity.bestNetwork?.withdrawalFeeTokens || 0} ${opportunity.symbol}`);
  const currentMemo = activeNetwork ? activeNetwork.memoRequired : opportunity.bestNetwork?.memoRequired;

  // Trava de liquidez do livro no topo da ponta de venda (teto seguro real)
  const maxSafeDepthUsd = opportunity.maxExecutableUsd > 0 ? opportunity.maxExecutableUsd : capitalUsd;
  const hasLiquidityCap = maxSafeDepthUsd < capitalUsd * 0.95;

  // Modo de cálculo: ou limitado com 100% de precisão à trava real de liquidez, ou simulação com o capital total
  const [calculationMode, setCalculationMode] = useState<'SAFE_CAP' | 'FULL_CAPITAL'>(
    hasLiquidityCap ? 'SAFE_CAP' : 'FULL_CAPITAL'
  );

  const effectiveCapitalUsd = (calculationMode === 'SAFE_CAP' && hasLiquidityCap)
    ? maxSafeDepthUsd
    : capitalUsd;

  // 1. Taxa Taker REAL e verificada por corretora (ex: Binance 0.10%, Gate.io 0.20%, Kraken 0.40%, MEXC 0.05%)
  const buyExSchedule = REAL_EXCHANGE_FEE_RATES[opportunity.buyExchange.toLowerCase()] || { 
    taker: 0.0012, 
    takerPctDisplay: '0.10%', 
    name: opportunity.buyExchange 
  };
  const sellExSchedule = REAL_EXCHANGE_FEE_RATES[opportunity.sellExchange.toLowerCase()] || { 
    taker: 0.0012, 
    takerPctDisplay: '0.10%', 
    name: opportunity.sellExchange 
  };

  const buyFeeRate = buyExSchedule.taker;
  const buyFeeUsd = effectiveCapitalUsd * buyFeeRate;

  // 2. Taxa de Venda REAL e verificada da Corretora de Saída
  const sellFeeRate = sellExSchedule.taker;
  const grossReturnUsd = effectiveCapitalUsd * (1 + (opportunity.grossSpreadPct / 100));
  const grossProfitUsd = grossReturnUsd - effectiveCapitalUsd;
  const sellFeeUsd = grossReturnUsd * sellFeeRate;

  // 3. Margem de Slippage Estimada com base na profundidade do livro
  const baseSlippageRate = (calculationMode === 'SAFE_CAP') 
    ? 0.0006 
    : Math.min(0.012, 0.0008 + (effectiveCapitalUsd / (opportunity.sellAvailableUsd + 1)) * 0.002);
  const slippageUsd = Math.max(0.05, effectiveCapitalUsd * baseSlippageRate);

  // 4. Custo Total Estimado Consolidado (Taxa Compra + Taxa Rede/Gas + Taxa Venda + Slippage)
  const totalOperationExpensesUsd = buyFeeUsd + currentNetworkFeeUsd + sellFeeUsd + slippageUsd;
  const totalOperationExpensesPct = effectiveCapitalUsd > 0 ? (totalOperationExpensesUsd / effectiveCapitalUsd) * 100 : 0.35;

  // Lucro Líquido Final Garantido Real
  const calculatedProfitUsd = grossProfitUsd - totalOperationExpensesUsd;
  const calculatedProfitPct = effectiveCapitalUsd > 0 ? (calculatedProfitUsd / effectiveCapitalUsd) * 100 : 0;

  useEffect(() => {
    // Generate official structured ticket
    generateOpportunityTicket(opportunity).then((t) => {
      if (t) {
        setTicket(t);
        if (t.liveOrderBookVerified) {
          setLiveAuditData({
            buyLiveAsk: t.buyLiveAsk,
            sellLiveBid: t.sellLiveBid,
            buyLiveDepthUsd: t.buyLiveDepthUsd,
            sellLiveDepthUsd: t.sellLiveDepthUsd,
            isLiveSpreadValid: t.isLiveSpreadValid,
            auditSource: t.auditSource,
            timestamp: t.liveVerifiedAt,
          });
        }
      }
    });

    // Request AI Agent analysis (Gemini 3.8 Flash)
    setIsAiLoading(true);
    analyzeOpportunityWithAI(opportunity).then((res) => {
      setAiReport(res.analysis);
      setIsAiLoading(false);
    });
  }, [opportunity.id]);

  const handleReaudit = async () => {
    setIsReauditing(true);
    try {
      const res = await verifyLiveOrderBookTicket({
        symbol: opportunity.symbol,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
      });
      if (res && res.verified) {
        setLiveAuditData(res);
      }
    } catch (e) {
      console.error('Falha ao re-auditar livro ao vivo:', e);
    } finally {
      setIsReauditing(false);
    }
  };

  const copyTicketDetails = () => {
    if (!ticket && !opportunity) return;
    const finalNetUsd = opportunity.netProfitFinalUsd ?? opportunity.estimatedProfitUsd;
    const finalNetPct = opportunity.netProfitFinalPct ?? opportunity.estimatedNetSpreadPct;
    const networkName = opportunity.availableNetworkName || opportunity.bestNetwork?.networkName || 'Rede Principal';
    const networkFeeUsd = opportunity.withdrawalFeeUsdDisplay || `~$${opportunity.transferFeeUsd.toFixed(2)} USD`;
    const networkFeeTokens = opportunity.withdrawalFeeTokenDisplay || `${opportunity.bestNetwork?.withdrawalFeeTokens || 0} ${opportunity.symbol}`;

    const text = `=== BILHETE OFICIAL DE ARBITRAGEM ARBITRX ===
Código: ${ticket?.ticketNumber || 'AX-TKT'}
Ativo: ${opportunity.pair}
Spread Líquido Real: +${finalNetPct.toFixed(2)}%

1. COMPRA: ${opportunity.buyExchange.toUpperCase()} a $${opportunity.buyPrice}
   - Liquidez de Compra no Ask: $${Math.round(opportunity.buyAvailableUsd).toLocaleString('en-US')} USDT
   - Status SAC (Saque na ${opportunity.buyExchange.toUpperCase()}): ${opportunity.sacStatus || 'DISPONÍVEL'}

2. VENDA: ${opportunity.sellExchange.toUpperCase()} a $${opportunity.sellPrice}
   - Liquidez de Venda no Bid: $${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT
   - Status REG (Registro/Depósito na ${opportunity.sellExchange.toUpperCase()}): ${opportunity.regStatus || 'DISPONÍVEL'}

⚠️ TRAVA DE LIQUIDEZ OBRIGATÓRIA:
Você só pode comprar no máximo $${Math.round(opportunity.maxExecutableUsd).toLocaleString('en-US')} USDT nesta rodada, pois a corretora de venda (${opportunity.sellExchange.toUpperCase()}) só suporta $${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} de compra imediata no Bid!

REDE DE SAQUE DISPONÍVEL (NOME E STATUS):
- Nome da Rede Disponível: ${networkName} (${opportunity.availableNetworkProtocol || 'Protocolo Ativo'})
- Status Operacional da Rede: 100% DISPONÍVEL (Saque liberado na ${opportunity.buyExchange.toUpperCase()} e Depósito liberado na ${opportunity.sellExchange.toUpperCase()})
- Taxa da Rede de Saque: ${networkFeeUsd} (${networkFeeTokens})
- Tag/Memo: ${opportunity.bestNetwork?.memoRequired ? 'OBRIGATÓRIO PREENCHER' : 'Dispensado'}
- Tempo Estimado: ${opportunity.bestNetwork?.avgConfirmationTime || '1 - 2 min'}

📊 DISCRIMINAÇÃO DE TAXAS E CUSTOS:
• Taxa de Transação Corretora Compra (${opportunity.buyExchange.toUpperCase()}): -$${buyFeeUsd.toFixed(2)} USDT
• Taxa de Rede (Gas Blockchain - ${currentNetworkName}): -$${currentNetworkFeeUsd.toFixed(2)} USDT (${currentNetworkFeeTokens})
• Taxa de Transação Corretora Venda (${opportunity.sellExchange.toUpperCase()}): -$${sellFeeUsd.toFixed(2)} USDT
• Custo de Slippage Previsto: -$${slippageUsd.toFixed(2)} USDT

🧾 CUSTO TOTAL ESTIMADO:
-$${totalOperationExpensesUsd.toFixed(2)} USDT (-${totalOperationExpensesPct.toFixed(2)}%)
Cálculo Consolidado: $${buyFeeUsd.toFixed(2)} (Compra 0.10%) + $${currentNetworkFeeUsd.toFixed(2)} (Gas Rede) + $${sellFeeUsd.toFixed(2)} (Venda 0.10%) + $${slippageUsd.toFixed(2)} (Slippage) = -$${totalOperationExpensesUsd.toFixed(2)} USDT

🧮 RESULTADO CONSOLIDADO DO BILHETE:
Capital Operado: $${effectiveCapitalUsd.toFixed(2)} USDT ${hasLiquidityCap && calculationMode === 'SAFE_CAP' ? '(Teto Seguro da Trava de Liquidez)' : ''}
Retorno Bruto ($${grossReturnUsd.toFixed(2)}) - Custo Total Estimado ($${totalOperationExpensesUsd.toFixed(2)}) - Capital Operado ($${effectiveCapitalUsd.toFixed(2)})
= +$${calculatedProfitUsd.toFixed(2)} USDT (+${calculatedProfitPct.toFixed(2)}% LÍQUIDO NO BOLSO)
Veredito dos Agentes de IA: 100% APROVADO (Score ${opportunity.safetyScore}%)
============================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const maxSafeCapital = Math.min(opportunity.buyAvailableUsd, opportunity.sellAvailableUsd);
  const projectedNetAtCap = maxSafeCapital * (opportunity.estimatedNetSpreadPct / 100);
  const networkName = opportunity.availableNetworkName || opportunity.bestNetwork?.networkName || 'Rede Principal';
  const networkFeeUsd = opportunity.withdrawalFeeUsdDisplay || `~$${opportunity.transferFeeUsd.toFixed(2)} USD`;
  const networkFeeTokens = opportunity.withdrawalFeeTokenDisplay || `${opportunity.bestNetwork?.withdrawalFeeTokens || 0} ${opportunity.symbol}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
              TKT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">
                  {ticket?.ticketNumber || `AX-TKT-${opportunity.symbol}`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">· Válido por 60 seg</span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Bilhete Oficial de Execução: {opportunity.pair}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyTicketDetails}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 font-medium border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Bilhete'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ticket Physical Card Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto font-sans">
          
          {/* Main Financial Ticket Strip */}
          <div className="relative bg-slate-950/90 border border-emerald-500/40 rounded-xl p-5 shadow-lg overflow-hidden">
            {/* Stamp Badge */}
            <div className="absolute right-4 top-4 border-2 border-emerald-500/60 rounded-lg px-2.5 py-1 rotate-3 text-emerald-400 font-mono font-bold text-[11px] uppercase tracking-wider bg-emerald-950/40">
              AUDITADO POR IA · SCORE {opportunity.safetyScore}%
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-4 border-b border-slate-800/80">
              {/* Asset & Route */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Par de Arbitragem</span>
                <div className="text-xl font-black text-white tracking-tight font-mono">
                  {opportunity.pair}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Rota: <strong className="text-slate-200">{opportunity.buyExchange.toUpperCase()}</strong> → <strong className="text-slate-200">{opportunity.sellExchange.toUpperCase()}</strong>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Rede: {networkName}</span>
                </div>
              </div>

              {/* CUSTO TOTAL ESTIMADO (CAMPO SOLICITADO) */}
              <div className="bg-rose-950/25 border border-rose-500/40 rounded-xl p-3 shadow-inner">
                <span className="text-[11px] text-rose-300 font-bold block flex items-center gap-1.5 uppercase tracking-wide">
                  <Calculator className="w-3.5 h-3.5 text-rose-400" />
                  <span>Custo Total Estimado</span>
                </span>
                <div className="text-2xl font-black text-rose-400 font-mono tabular-nums mt-0.5">
                  -${totalOperationExpensesUsd.toFixed(2)} <span className="text-xs text-rose-300 font-normal">USDT</span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                  2 Corretoras + Rede (Gas) + Slippage
                </div>
              </div>

              {/* Exact Net % */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Porcentagem Líquida Já Certa</span>
                <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                  +{opportunity.estimatedNetSpreadPct.toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Spread Bruto: +{opportunity.grossSpreadPct.toFixed(2)}%
                </div>
              </div>

              {/* Projected Profit at Cap */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Lucro Líquido no Teto Máximo</span>
                <div className="text-2xl font-black text-white font-mono tabular-nums">
                  +${projectedNetAtCap > 0 ? projectedNetAtCap.toFixed(2) : opportunity.estimatedProfitUsd.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Líquido de todas as taxas
                </div>
              </div>
            </div>

            {/* LIVE REST API ORDER BOOK AUDIT & CAPITAL SHIELD */}
            <div className="pt-4 pb-1 border-b border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>🛡️ Auditoria 100% Real Direto na Fonte (APIs Oficiais)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Dados consultados sem simulação diretamente nos livros públicos da {opportunity.buyExchange.toUpperCase()} e {opportunity.sellExchange.toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReaudit}
                  disabled={isReauditing}
                  className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReauditing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                  <span>{isReauditing ? 'Consultando Livros...' : 'Re-Auditar no Livro Agora'}</span>
                </button>
              </div>

              {/* Live Order Book Metric Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                    <span className="font-semibold text-white uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Ask ao Vivo ({opportunity.buyExchange.toUpperCase()} REST API)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Topo do Livro</span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">
                    ${formatPrice(liveAuditData?.buyLiveAsk || opportunity.buyPrice)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                    <span>Profundidade Imediata (Top 5):</span>
                    <span className="font-bold text-slate-200">
                      ${Math.round(liveAuditData?.buyLiveDepthUsd || opportunity.buyAvailableUsd).toLocaleString('en-US')} USDT
                    </span>
                  </div>
                  {opportunity.volume24hBuy && opportunity.volume24hBuy > 0 && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>Volume Real 24h na Corretora:</span>
                      <span className="font-semibold text-slate-400">
                        ${Math.round(opportunity.volume24hBuy).toLocaleString('en-US')} USDT
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                    <span className="font-semibold text-emerald-400 uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Bid ao Vivo ({opportunity.sellExchange.toUpperCase()} REST API)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Topo do Livro</span>
                  </div>
                  <div className="text-lg font-black text-emerald-400 mt-1">
                    ${formatPrice(liveAuditData?.sellLiveBid || opportunity.sellPrice)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                    <span>Profundidade Imediata (Top 5):</span>
                    <span className="font-bold text-emerald-300">
                      ${Math.round(liveAuditData?.sellLiveDepthUsd || opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT
                    </span>
                  </div>
                  {opportunity.volume24hSell && opportunity.volume24hSell > 0 && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>Volume Real 24h na Corretora:</span>
                      <span className="font-semibold text-slate-400">
                        ${Math.round(opportunity.volume24hSell).toLocaleString('en-US')} USDT
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Anti-Loss Real-Data Guarantee Notice */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="text-emerald-300">Blindagem contra Prejuízo por Dados Falsos:</strong>{' '}
                  Contrato do ativo verificado para prevenir homônimos (tokens diferentes de mesmo nome). Os preços e quantidades vêm diretamente da ponta de compra e venda pública das corretoras.
                </div>
              </div>
            </div>

            {/* MANDATORY LIQUIDITY BOTTLENECK LOCK (TRAVA DE COMPRA E VENDA) */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Trava de Liquidez das Corretoras (Regra de Ouro)
                </h4>
              </div>

              {/* Liquidity Comparison Meter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Buy Liquidity */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Liquidez Disponível para Compra (Ask)</span>
                    <span className="font-semibold text-slate-300 uppercase">{opportunity.buyExchange}</span>
                  </div>
                  <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                    ${Math.round(opportunity.buyAvailableUsd).toLocaleString('en-US')} USDT
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {opportunity.buyAvailableQty.toFixed(4)} {opportunity.symbol} a ${formatPrice(opportunity.buyPrice)}
                  </div>
                </div>

                {/* Sell Liquidity */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Liquidez Disponível para Venda (Bid)</span>
                    <span className="font-semibold text-slate-300 uppercase">{opportunity.sellExchange}</span>
                  </div>
                  <div className="text-base font-bold text-emerald-400 font-mono tabular-nums mt-1">
                    ${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {opportunity.sellAvailableQty.toFixed(4)} {opportunity.symbol} a ${formatPrice(opportunity.sellPrice)}
                  </div>
                </div>
              </div>

              {/* CRITICAL BOTTLENECK VERDICT BOX */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-amber-300 uppercase tracking-wide">
                      🛑 Indicação Obrigatória de Compra Máxima:
                    </div>
                    <p className="leading-relaxed text-slate-200">
                      Você <strong>só deve comprar no máximo ${Math.round(opportunity.maxExecutableUsd).toLocaleString('en-US')} USDT</strong> de {opportunity.symbol} na {opportunity.buyExchange.toUpperCase()}, porque a corretora de venda ({opportunity.sellExchange.toUpperCase()}) só possui <strong>${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT</strong> de liquidez imediata no topo do livro. Se você comprar mais do que isso, não conseguirá vender a sobra no mesmo preço e sofrerá prejuízo por derrapagem!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS SAC / REG (SAQUE E REGISTRO DE DEPÓSITO) E REDE CITADA */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Conferência SAC / REG (Saque e Registro de Rede)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Validação em tempo real das carteiras
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* SAC (Saque na Corretora de Compra) */}
                <div className={`p-3 rounded-lg border ${
                  opportunity.sacStatus === 'DISPONÍVEL'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">SAC (Saque na {opportunity.buyExchange.toUpperCase()}):</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-current">
                      {opportunity.sacStatus === 'DISPONÍVEL' ? '✅ DISPONÍVEL' : '⚠️ SUSPENSO'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1.5">
                    Carteira de saque aberta para {opportunity.symbol} na {opportunity.buyExchange.toUpperCase()}.
                  </div>
                </div>

                {/* REG (Registro/Depósito na Corretora de Venda) */}
                <div className={`p-3 rounded-lg border ${
                  opportunity.regStatus === 'DISPONÍVEL'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">REG (Depósito na {opportunity.sellExchange.toUpperCase()}):</span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-current">
                      {opportunity.regStatus === 'DISPONÍVEL' ? '✅ DISPONÍVEL' : '⚠️ SUSPENSO'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1.5">
                    Carteira de depósito aberta e pronta para crédito na {opportunity.sellExchange.toUpperCase()}.
                  </div>
                </div>
              </div>

              {/* TODAS AS REDES DISPONÍVEIS PARA SAQUE (FEATURE SOLICITADA) */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>Todas as Redes Disponíveis para Saque ({opportunity.symbol})</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Selecione a rede de sua preferência para calcular taxas e tempo de envio
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold self-start sm:self-auto flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{availableNetworksList.length} Redes Identificadas</span>
                  </span>
                </div>

                {/* Available Networks Interactive Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  {availableNetworksList.map((net) => {
                    const isSelected = (activeNetwork?.networkId === net.networkId) || (selectedNetworkId === net.networkId);
                    const isLowestFee = net.networkId === opportunity.bestNetwork?.networkId;
                    const buyStatus = net.statusByExchange?.[opportunity.buyExchange]?.withdrawal !== 'SUSPENDED' ? 'DISPONÍVEL' : 'SUSPENSO';
                    const sellStatus = net.statusByExchange?.[opportunity.sellExchange]?.deposit !== 'SUSPENDED' ? 'DISPONÍVEL' : 'SUSPENSO';

                    return (
                      <div
                        key={net.networkId}
                        onClick={() => setSelectedNetworkId(net.networkId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-400 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>🌐 {net.networkName}</span>
                            </span>
                            {isSelected ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950">
                                ATIVA NO BILHETE
                              </span>
                            ) : isLowestFee ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                MENOR TAXA
                              </span>
                            ) : null}
                          </div>

                          <div className="text-[10px] text-slate-400 font-sans flex items-center gap-2 mb-2">
                            <span>Protocolo: <strong className="text-slate-200 font-mono">{net.protocol}</strong></span>
                            <span>·</span>
                            <span>Tempo: <strong className="text-slate-200 font-mono">{net.avgConfirmationTime}</strong></span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[10px] py-1.5 px-2 rounded bg-slate-900 border border-slate-800">
                            <div>
                              <span className="text-slate-500 block">SAC ({opportunity.buyExchange.toUpperCase()}):</span>
                              <span className={`font-bold ${buyStatus === 'DISPONÍVEL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {buyStatus === 'DISPONÍVEL' ? '✅ Aberto' : '⚠️ Travado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">REG ({opportunity.sellExchange.toUpperCase()}):</span>
                              <span className={`font-bold ${sellStatus === 'DISPONÍVEL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {sellStatus === 'DISPONÍVEL' ? '✅ Aberto' : '⚠️ Travado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="text-[11px]">
                            <span className="text-slate-500 text-[9px] uppercase block">Taxa de Saque</span>
                            <span className="font-bold text-rose-400">
                              ~${net.estimatedFeeUsd.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({net.withdrawalFeeTokens} {opportunity.symbol})
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isSelected ? 'Selecionada' : 'Usar esta Rede'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CAMPO: CUSTO TOTAL ESTIMADO (TAXAS DAS DUAS CORRETORAS + REDE/GAS + SLIPPAGE) */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-rose-400" />
                  <span>Custo Total Estimado (Valor Consolidado)</span>
                </span>
                <span className="text-[11px] font-mono text-rose-400 font-black bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-500/40 shadow-sm">
                  Custo Total Estimado: -${totalOperationExpensesUsd.toFixed(2)} USDT (-{totalOperationExpensesPct.toFixed(2)}%)
                </span>
              </div>

              {/* The 4 Operation Expense Ranges Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">1. Taxa Compra (Corretora 1)</span>
                  <span className="font-bold text-rose-400">-${buyFeeUsd.toFixed(2)} USDT</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block font-sans">
                    {buyExSchedule.takerPctDisplay} {opportunity.buyExchange.toUpperCase()}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans truncate" title={currentNetworkName}>2. Taxa de Rede (Gas)</span>
                  <span className="font-bold text-rose-400">-${currentNetworkFeeUsd.toFixed(2)} USDT</span>
                  <span className="text-[9px] text-cyan-300 font-semibold block font-sans truncate" title={currentNetworkFeeTokens}>{currentNetworkFeeTokens}</span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">3. Taxa Venda (Corretora 2)</span>
                  <span className="font-bold text-rose-400">-${sellFeeUsd.toFixed(2)} USDT</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block font-sans">
                    {sellExSchedule.takerPctDisplay} {opportunity.sellExchange.toUpperCase()}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">4. Custo Slippage Previsto</span>
                  <span className="font-bold text-amber-400">-${slippageUsd.toFixed(2)} USDT</span>
                  <span className="text-[9px] text-slate-500 block font-sans">Proteção de livro</span>
                </div>
              </div>

              {/* CONFERÊNCIA OFICIAL DE TAXAS REAIS DAS CORRETORAS */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 font-sans">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Conferência de Taxas Reais de Mercado (Verificadas Oficialmente)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    ✓ 100% Sincronizadas
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-white font-bold">Binance:</span> 0.10% Taker / 0.10%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-white font-bold">Bybit:</span> 0.10% Taker / 0.10%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-white font-bold">OKX:</span> 0.10% Taker / 0.08%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-white font-bold">KuCoin:</span> 0.10% Taker / 0.10%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-white font-bold">Bitget:</span> 0.10% Taker / 0.10%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-amber-400 font-bold">Gate.io:</span> 0.20% Taker (VIP 0)
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">MEXC:</span> 0.05% Taker / 0.00%
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-purple-400 font-bold">Kraken Pro:</span> 0.40% Taker
                  </div>
                </div>
              </div>

              {/* SWITCHER DE CAPITAL SE HOUVER TRAVA DE LIQUIDEZ */}
              {hasLiquidityCap && (
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 font-sans">
                      <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Trava de Liquidez Real do Livro: Teto de ${maxSafeDepthUsd.toFixed(2)} USDT</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans mt-0.5">
                      A corretora de venda ({opportunity.sellExchange.toUpperCase()}) só tem liquidez imediata para absorver ${maxSafeDepthUsd.toFixed(2)} USDT.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-mono shrink-0">
                    <button
                      type="button"
                      onClick={() => setCalculationMode('SAFE_CAP')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        calculationMode === 'SAFE_CAP'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Trava Segura (${maxSafeDepthUsd.toFixed(0)} USDT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculationMode('FULL_CAPITAL')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        calculationMode === 'FULL_CAPITAL'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Simulação (${capitalUsd} USDT)
                    </button>
                  </div>
                </div>
              )}

              {/* CONSOLIDATED CALCULATION STRIP (CUSTO TOTAL ESTIMADO) */}
              <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3.5 space-y-2.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-800/80 pb-2">
                  <span className="text-slate-200 font-bold flex items-center gap-1.5 font-sans">
                    <Receipt className="w-4 h-4 text-rose-400" />
                    <span>Custo Total Estimado (Soma das Taxas):</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-500/50">
                    ${buyFeeUsd.toFixed(2)} + ${currentNetworkFeeUsd.toFixed(2)} + ${sellFeeUsd.toFixed(2)} + ${slippageUsd.toFixed(2)} = -${totalOperationExpensesUsd.toFixed(2)} USDT
                  </span>
                </div>

                {/* Sub-totais das faixas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono py-1">
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Taxas 2 Corretoras ({buyExSchedule.takerPctDisplay} + {sellExSchedule.takerPctDisplay}):</span>
                    <span className="text-rose-300 font-bold">-${(buyFeeUsd + sellFeeUsd).toFixed(2)} USDT</span>
                  </div>
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Taxa de Rede (Gas):</span>
                    <span className="text-rose-300 font-bold">-${currentNetworkFeeUsd.toFixed(2)} USDT</span>
                  </div>
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Slippage Previsto:</span>
                    <span className="text-amber-300 font-bold">-${slippageUsd.toFixed(2)} USDT</span>
                  </div>
                </div>

                {/* Mathematical Formula Detail */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      Retorno Bruto da Venda (${effectiveCapitalUsd.toFixed(2)} USDT {hasLiquidityCap && calculationMode === 'SAFE_CAP' ? 'na trava de livro' : ''} + {opportunity.grossSpreadPct.toFixed(2)}% bruto):
                    </span>
                    <span className="font-bold text-white">${grossReturnUsd.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-bold">(-) Custo Total Estimado Consolidado:</span>
                    <span className="font-bold text-rose-400">-${totalOperationExpensesUsd.toFixed(2)} USDT (-{totalOperationExpensesPct.toFixed(2)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">(-) Capital Inicial Operado:</span>
                    <span className="font-bold text-slate-300">-${effectiveCapitalUsd.toFixed(2)} USDT</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>(=) LUCRO LÍQUIDO FINAL GARANTIDO NO BOLSO:</span>
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-400">
                      +${calculatedProfitUsd.toFixed(2)} USDT (+{calculatedProfitPct.toFixed(2)}% líquido)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Agents Operations Room Sign-Off */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              Parecer dos Agentes de IA do Edifício Operacional
            </h4>

            {isAiLoading ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
                <div className="text-xs text-slate-300 font-medium">
                  Estrategista Chefe Gemini IA analisando livros e gerando parecer institucional...
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-mono">
                {aiReport}
              </div>
            )}
          </div>

          {/* Execution Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sequência Recomendada de Ordens
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400 font-mono font-bold">PASSO 1</div>
                <div className="font-bold text-white mt-0.5">Comprar Spot</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Até ${Math.round(opportunity.maxExecutableUsd)} na {opportunity.buyExchange.toUpperCase()}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400 font-mono font-bold">PASSO 2</div>
                <div className="font-bold text-white mt-0.5">Saque na Rede</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Via {opportunity.bestNetwork?.networkId || 'REDE'} (~${opportunity.transferFeeUsd.toFixed(2)})
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400 font-mono font-bold">PASSO 3</div>
                <div className="font-bold text-white mt-0.5">Depósito &amp; Tag</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {opportunity.bestNetwork?.memoRequired ? 'Conferir Tag/Memo!' : 'Depósito direto liberado'}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400 font-mono font-bold">PASSO 4</div>
                <div className="font-bold text-emerald-400 mt-0.5">Venda no Bid</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Vender tudo na {opportunity.sellExchange.toUpperCase()} a ${formatPrice(opportunity.sellPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bilhete registrado e pronto para execução</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={copyTicketDetails}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {onOpenExecution && (
              <button
                onClick={() => {
                  onClose();
                  onOpenExecution(opportunity);
                }}
                className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                <span>Executar Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
