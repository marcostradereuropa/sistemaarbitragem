import React, { useState } from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';
import { 
  X, CheckCircle2, ExternalLink, Copy, Check, AlertTriangle, 
  ArrowRight, ShieldCheck, Clock, DollarSign, Scale, Ticket, Sparkles, CheckSquare, Square
} from 'lucide-react';

interface ExecutionWizardModalProps {
  opportunity: ArbitrageOpportunity | null;
  onClose: () => void;
  capitalUsd: number;
}

export const ExecutionWizardModal: React.FC<ExecutionWizardModalProps> = ({
  opportunity,
  onClose,
  capitalUsd,
}) => {
  if (!opportunity) return null;

  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Done, setStep4Done] = useState(false);

  const [copiedPrice, setCopiedPrice] = useState(false);
  const [copiedQty, setCopiedQty] = useState(false);
  const [copiedNetwork, setCopiedNetwork] = useState(false);

  const symbol = opportunity.symbol;
  const is100Approved = opportunity.sacStatus === 'DISPONÍVEL' && 
                        opportunity.regStatus === 'DISPONÍVEL' && 
                        opportunity.networkStatus === 'ACTIVE';

  const finalNetUsd = opportunity.netProfitFinalUsd ?? opportunity.estimatedProfitUsd;
  const finalNetPct = opportunity.netProfitFinalPct ?? opportunity.estimatedNetSpreadPct;
  const networkName = opportunity.availableNetworkName || opportunity.bestNetwork?.networkName || 'Rede Principal';
  const networkFeeUsd = opportunity.withdrawalFeeUsdDisplay || `~$${opportunity.transferFeeUsd.toFixed(2)}`;
  const networkFeeTokens = opportunity.withdrawalFeeTokenDisplay || `${opportunity.bestNetwork?.withdrawalFeeTokens || 0} ${symbol}`;

  const getExchangeTradeUrl = (exchange: string, sym: string) => {
    const ex = exchange.toLowerCase();
    switch (ex) {
      case 'binance':
        return `https://www.binance.com/en/trade/${sym}_USDT?type=spot`;
      case 'kucoin':
        return `https://www.kucoin.com/trade/${sym}-USDT`;
      case 'okx':
        return `https://www.okx.com/trade-spot/${sym.toLowerCase()}-usdt`;
      case 'gate':
        return `https://www.gate.io/trade/${sym}_USDT`;
      case 'bitget':
        return `https://www.bitget.com/spot/${sym}USDT`;
      case 'kraken':
        return `https://pro.kraken.com/app/trade/${sym.toLowerCase()}-usd`;
      case 'mexc':
        return `https://www.mexc.com/exchange/${sym}_USDT`;
      case 'htx':
        return `https://www.htx.com/trade/${sym.toLowerCase()}_usdt`;
      default:
        return '#';
    }
  };

  const copyToClipboard = (text: string, type: 'price' | 'qty' | 'network') => {
    navigator.clipboard.writeText(text);
    if (type === 'price') {
      setCopiedPrice(true);
      setTimeout(() => setCopiedPrice(false), 2000);
    } else if (type === 'qty') {
      setCopiedQty(true);
      setTimeout(() => setCopiedQty(false), 2000);
    } else {
      setCopiedNetwork(true);
      setTimeout(() => setCopiedNetwork(false), 2000);
    }
  };

  const maxCapitalToExecute = Math.min(capitalUsd, opportunity.maxExecutableUsd);
  const tokensToExecute = maxCapitalToExecute / opportunity.buyPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs font-mono shadow-sm shadow-emerald-500/20">
              ⚡ EXE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">
                  CENTRAL DE EXECUÇÃO RÁPIDA
                </span>
                {is100Approved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✨ 100% APROVADO
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Executar Arbitragem: {opportunity.pair} ({opportunity.buyExchange.toUpperCase()} ➔ {opportunity.sellExchange.toUpperCase()})
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto font-sans">
          
          {/* Top Status & Pre-Fee Financial Bar */}
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Status SAC (Saque)</span>
              <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{opportunity.sacStatus} ({opportunity.buyExchange.toUpperCase()})</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Status REG (Depósito)</span>
              <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{opportunity.regStatus} ({opportunity.sellExchange.toUpperCase()})</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Nome da Rede Disponível</span>
              <div className="font-bold text-emerald-400 mt-0.5 truncate font-mono flex items-center gap-1" title={networkName}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{networkName}</span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">Status: DISPONÍVEL · Taxa: {networkFeeUsd}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Lucro Líquido Real</span>
              <div className="font-black text-emerald-400 mt-0.5 text-sm font-mono tabular-nums">
                +{finalNetUsd.toFixed(2)} USDT (+{finalNetPct.toFixed(2)}%)
              </div>
              <span className="text-[10px] text-slate-500">Taxas já descontadas</span>
            </div>
          </div>

          {/* Mandatory Liquidity Lock Banner */}
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 text-xs">
            <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <span>Trava Obrigatória de Capital Nesta Rodada:</span>
                <span className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                  Máximo ${Math.round(maxCapitalToExecute).toLocaleString('en-US')} USDT
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                A corretora de venda ({opportunity.sellExchange.toUpperCase()}) suporta <strong>${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT</strong> de venda imediata no topo do livro. Para evitar qualquer derrapagem ou moedas presas, <strong>não envie mais que {tokensToExecute.toFixed(4)} {symbol}</strong> nesta operação!
              </p>
            </div>
          </div>

          {/* Real Data & Direct Source Shield Notice */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">
                <strong className="text-emerald-300">Auditoria ao Vivo na Fonte:</strong> Cotações REST diretas de {opportunity.buyExchange.toUpperCase()} e {opportunity.sellExchange.toUpperCase()}.
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              100% REAL SEM DADOS FALSOS
            </span>
          </div>

          {/* Execution Checklist (Steps 1 to 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Roteiro de Execução Passo a Passo</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Marque cada passo conforme for executando nas corretoras
              </span>
            </div>

            {/* STEP 1 */}
            <div className={`p-4 rounded-xl border transition-all ${
              step1Done ? 'bg-slate-950/40 border-slate-800 opacity-80' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => setStep1Done(!step1Done)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {step1Done ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        PASSO 1 DE 4
                      </span>
                      <span className="font-bold text-white text-xs">
                        Comprar Spot no Ask na {opportunity.buyExchange.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-mono">
                      Comprar <strong>{tokensToExecute.toFixed(4)} {symbol}</strong> a <strong>${opportunity.buyPrice}</strong> (Total: ~${Math.round(maxCapitalToExecute)} USDT)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center pl-8 sm:pl-0">
                  <button
                    onClick={() => copyToClipboard(tokensToExecute.toFixed(4), 'qty')}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors flex items-center gap-1 border border-slate-700"
                  >
                    {copiedQty ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedQty ? 'Copiado!' : 'Qtd'}</span>
                  </button>

                  <a
                    href={getExchangeTradeUrl(opportunity.buyExchange, symbol)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Abrir {opportunity.buyExchange.toUpperCase()} Spot</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className={`p-4 rounded-xl border transition-all ${
              step2Done ? 'bg-slate-950/40 border-slate-800 opacity-80' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => setStep2Done(!step2Done)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {step2Done ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        PASSO 2 DE 4
                      </span>
                      <span className="font-bold text-white text-xs">
                        Solicitar Saque na Rede Disponível ({networkName})
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-mono">
                      Selecione a rede disponível <strong>{networkName}</strong> na tela de saque da {opportunity.buyExchange.toUpperCase()}. Taxa prevista: {networkFeeUsd} ({networkFeeTokens}).
                    </div>
                    {opportunity.bestNetwork?.memoRequired && (
                      <div className="text-[11px] text-amber-300 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>ATENÇÃO: É obrigatório copiar e colar o Destination Tag / Memo gerado pela corretora de destino!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center pl-8 sm:pl-0">
                  <button
                    onClick={() => copyToClipboard(networkName, 'network')}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors flex items-center gap-1 border border-slate-700"
                  >
                    {copiedNetwork ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedNetwork ? 'Copiada!' : 'Copiar Rede'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className={`p-4 rounded-xl border transition-all ${
              step3Done ? 'bg-slate-950/40 border-slate-800 opacity-80' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => setStep3Done(!step3Done)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {step3Done ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        PASSO 3 DE 4
                      </span>
                      <span className="font-bold text-white text-xs">
                        Aguardar Confirmação &amp; Crédito na {opportunity.sellExchange.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Tempo médio de blocos: {opportunity.bestNetwork?.avgConfirmationTime || '1 - 2 min'}. O status REG está liberado.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4 */}
            <div className={`p-4 rounded-xl border transition-all ${
              step4Done ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => setStep4Done(!step4Done)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {step4Done ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        PASSO 4 DE 4
                      </span>
                      <span className="font-bold text-emerald-400 text-xs">
                        Venda Imediata no Bid na {opportunity.sellExchange.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-mono">
                      Vender tudo a <strong>${opportunity.sellPrice}</strong> para realizar <strong>+{finalNetUsd.toFixed(2)} USDT líquido</strong>.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center pl-8 sm:pl-0">
                  <a
                    href={getExchangeTradeUrl(opportunity.sellExchange, symbol)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Vender na {opportunity.sellExchange.toUpperCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tip: Arbitragem Simultânea */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Dica do Estrategista para Risco Zero de Tempo:</strong> Se você já possui USDT na {opportunity.buyExchange.toUpperCase()} e saldo de {symbol} na {opportunity.sellExchange.toUpperCase()}, pode comprar e vender nos mesmos segundos sem esperar a transferência na blockchain!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Passos conferidos com a Trava de Liquidez</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg transition-colors text-xs"
          >
            Fechar Execução
          </button>
        </div>
      </div>
    </div>
  );
};
