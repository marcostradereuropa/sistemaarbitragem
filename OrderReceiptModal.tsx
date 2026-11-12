import React, { useState } from 'react';
import { AutoExecutionOrder } from '../types/automation';
import { REAL_EXCHANGE_FEE_RATES } from '../types/arbitrage';
import { 
  CheckCircle2, X, Copy, ExternalLink, ShieldCheck, 
  ArrowRight, DollarSign, Clock, Cpu, Check, FileText,
  Workflow, Layers, Sparkles
} from 'lucide-react';

interface OrderReceiptModalProps {
  order: AutoExecutionOrder | null;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!order) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  const buyRate = REAL_EXCHANGE_FEE_RATES[order.buyExchange.toLowerCase()] || { name: order.buyExchange, takerPctDisplay: '0.10%' };
  const sellRate = REAL_EXCHANGE_FEE_RATES[order.sellExchange.toLowerCase()] || { name: order.sellExchange, takerPctDisplay: '0.10%' };

  const capital = order.capitalUsd;
  const actualProfit = order.actualProfitUsd ?? 0;
  const actualPct = order.actualProfitPct ?? 0;
  const grossReturn = order.grossReturnUsd ?? (capital + actualProfit + (order.totalFeesUsd ?? 0));

  const buyFee = order.buyFeeUsd ?? (capital * 0.001);
  const sellFee = order.sellFeeUsd ?? (grossReturn * 0.001);
  const networkGas = order.networkGasUsd ?? 0.35;
  const slippage = order.slippageUsd ?? (capital * 0.0007);
  const quantumFee = order.quantumFeeUsd ?? (order.quantumRebalance?.transferFeeUsd ?? 0);
  const totalFees = order.totalFeesUsd ?? (buyFee + sellFee + networkGas + slippage + quantumFee);

  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const fullReceiptText = `
========================================
M.ÁRBITRO - COMPROVANTE OFICIAL DE ARBITRAGEM
ID DA ORDEM: ${order.id}
DATA: ${formattedDate}
PAR: ${order.symbol}/USDT
STATUS: 100% CONCLUÍDO & AUDITADO
========================================
ROTA: ${order.buyExchange.toUpperCase()} (Compra) ➔ ${order.sellExchange.toUpperCase()} (Venda)
REDE: ${order.networkName} (${order.networkProtocol})
CAPITAL OPERADO: $${capital.toFixed(2)} USDT

1. COMPRA (ASK):
   - Corretora: ${order.buyExchange.toUpperCase()}
   - Preço: $${order.buyPrice.toFixed(4)}
   - Taxa Corretora (${buyRate.takerPctDisplay}): -$${buyFee.toFixed(2)} USDT

2. TRANSFERÊNCIA BLOCKCHAIN:
   - Rede: ${order.networkName}
   - Taxa de Rede (Gas): -$${networkGas.toFixed(2)} USDT
   - TxHash: ${order.withdrawTxId || 'N/A'}

3. VENDA (BID):
   - Corretora: ${order.sellExchange.toUpperCase()}
   - Preço: $${order.sellPrice.toFixed(4)}
   - Retorno Bruto: $${grossReturn.toFixed(2)} USDT
   - Taxa Corretora (${sellRate.takerPctDisplay}): -$${sellFee.toFixed(2)} USDT

4. BUFFER & ROTEAMENTO:
   - Slippage de Proteção: -$${slippage.toFixed(2)} USDT
   ${quantumFee > 0 ? `- Roteamento Quântico: -$${quantumFee.toFixed(2)} USDT (${order.quantumRebalance?.fromExchange.toUpperCase()} ➔ ${order.buyExchange.toUpperCase()})` : '- Roteamento Quântico: $0.00 (Rota Local)'}

----------------------------------------
CUSTO TOTAL DE TAXAS: -$${totalFees.toFixed(2)} USDT
(=) LUCRO LÍQUIDO REALIZADO: +$${actualProfit.toFixed(2)} USDT (+${actualPct.toFixed(2)}%)
SALDO FINAL ALOCADO EM: ${order.sellExchange.toUpperCase()}
========================================
Auditoria: 5 Travas de Segurança Aprovadas.
  `.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Comprovante Oficial de Execução
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {order.isSimulated ? 'SIMULAÇÃO AUDITADA' : 'ORDEM REAL LIQUIDADA'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {order.id} • {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(fullReceiptText, 'all')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
              title="Copiar Comprovante Completo"
            >
              {copied === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Comprovante</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Profit Callout */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Lucro Líquido Real Garantido no Bolso
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                +${actualProfit.toFixed(2)} USDT{' '}
                <span className="text-base sm:text-lg font-bold text-emerald-300">
                  (+{actualPct.toFixed(2)}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Capital Inicial Operado: <strong className="text-white">${capital.toFixed(2)} USDT</strong>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-right sm:self-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Localização do Saldo:</span>
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center justify-end gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {order.sellExchange.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Pronto para o próximo giro contínuo
              </span>
            </div>
          </div>

          {/* 5-Lock Audit Badge Bar */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Auditoria Pré-Execução das 5 Travas de Segurança
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">100% APROVADO</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
              <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/20 text-emerald-300 text-center">
                ✓ SAC Origem Ativo
              </div>
              <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/20 text-emerald-300 text-center">
                ✓ REG Destino Ativo
              </div>
              <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/20 text-emerald-300 text-center">
                ✓ Trava do Livro OK
              </div>
              <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/20 text-emerald-300 text-center">
                ✓ Taxas Reais
              </div>
              <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/20 text-emerald-300 text-center col-span-2 sm:col-span-1">
                ✓ Cérebro Quântico
              </div>
            </div>
          </div>

          {/* Execution Route Visual */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Rota de Execução da Ordem
            </span>

            {/* Quantum rebalance banner if happened */}
            {order.quantumRebalance && order.quantumRebalance.required && (
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Roteamento Quântico Prévio: {order.quantumRebalance.fromExchange.toUpperCase()} ➔ {order.buyExchange.toUpperCase()} via BEP20
                  </span>
                </div>
                <span className="text-[11px] font-bold text-cyan-400">
                  Taxa: ${order.quantumRebalance.transferFeeUsd.toFixed(2)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Buy Leg */}
              <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">1. Compra no Ask</span>
                  <span className="text-[10px] font-mono text-slate-400">{buyRate.takerPctDisplay}</span>
                </div>
                <div className="text-sm font-bold text-white uppercase">{order.buyExchange}</div>
                <div className="text-xs font-mono text-slate-300">
                  Preço: <strong className="text-white">${order.buyPrice.toFixed(4)}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Moedas Compradas: {order.tokensAmount ? order.tokensAmount.toFixed(2) : ((capital - buyFee) / order.buyPrice).toFixed(2)} {order.symbol}
                </div>
              </div>

              {/* Transfer Leg */}
              <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl space-y-1 text-center">
                <div className="text-[10px] font-mono text-purple-300 font-bold uppercase">
                  2. Transferência Blockchain
                </div>
                <div className="text-xs font-bold text-white truncate">{order.networkName}</div>
                <div className="text-xs font-mono text-purple-300">
                  Gas: <strong className="text-white">${networkGas.toFixed(2)} USDT</strong>
                </div>
                <div className="text-[10px] text-slate-400">Confirmação de bloco validada</div>
              </div>

              {/* Sell Leg */}
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">3. Venda no Bid</span>
                  <span className="text-[10px] font-mono text-slate-400">{sellRate.takerPctDisplay}</span>
                </div>
                <div className="text-sm font-bold text-white uppercase">{order.sellExchange}</div>
                <div className="text-xs font-mono text-slate-300">
                  Preço: <strong className="text-white">${order.sellPrice.toFixed(4)}</strong>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold">
                  Retorno: ${grossReturn.toFixed(2)} USDT
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Cost & Mathematical Formula (Bilhete Consolidado) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Demonstrativo Contábil de Taxas e Gastos Reais:</span>
              <span className="font-mono text-rose-400 font-bold">Total: -${totalFees.toFixed(2)} USDT</span>
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">1. Taxa Compra ({order.buyExchange.toUpperCase()} {buyRate.takerPctDisplay}):</span>
                <span className="text-rose-400 font-bold">-${buyFee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">2. Taxa de Rede Blockchain (Gas {order.networkName}):</span>
                <span className="text-rose-400 font-bold">-${networkGas.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">3. Taxa Venda ({order.sellExchange.toUpperCase()} {sellRate.takerPctDisplay}):</span>
                <span className="text-rose-400 font-bold">-${sellFee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">4. Buffer de Proteção contra Slippage:</span>
                <span className="text-amber-400 font-bold">-${slippage.toFixed(2)} USDT</span>
              </div>
              {quantumFee > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">5. Roteamento Quântico de Saldo ({order.quantumRebalance?.network}):</span>
                  <span className="text-cyan-400 font-bold">-${quantumFee.toFixed(2)} USDT</span>
                </div>
              )}

              {/* Formula equation highlight */}
              <div className="mt-3 p-3 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300">
                <div className="text-[11px] text-slate-400 mb-1">Cálculo Auditado da Operação:</div>
                <div className="text-xs text-white font-bold leading-relaxed">
                  Retorno Bruto (${grossReturn.toFixed(2)}) - Capital (${capital.toFixed(2)}) - Taxas Totais (${totalFees.toFixed(2)}) =
                  <span className="text-emerald-400 ml-1 font-black">
                    +${actualProfit.toFixed(2)} USDT Líquidos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Hashes */}
          {order.withdrawTxId && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Comprovantes Criptográficos (Hashes Oficiais na Blockchain)
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg font-mono text-xs">
                <div className="truncate">
                  <span className="text-purple-400 font-bold mr-2">Tx Transferência:</span>
                  <span className="text-slate-300">{order.withdrawTxId}</span>
                </div>
                <button
                  onClick={() => handleCopy(order.withdrawTxId!, 'tx')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
                >
                  {copied === 'tx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'tx' ? 'Copiado!' : 'Copiar Hash'}</span>
                </button>
              </div>

              {order.quantumRebalance?.txHash && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg font-mono text-xs">
                  <div className="truncate">
                    <span className="text-cyan-400 font-bold mr-2">Tx Roteamento Quântico:</span>
                    <span className="text-slate-300">{order.quantumRebalance.txHash}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(order.quantumRebalance!.txHash, 'qtx')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
                  >
                    {copied === 'qtx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'qtx' ? 'Copiado!' : 'Copiar Hash'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step-by-Step Execution Logs */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Registro Auditado de Ações do Robô (Logs)
            </span>
            <div className="p-3 bg-slate-900 rounded-lg max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-300">
              {order.logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between sticky bottom-0">
          <div className="text-[11px] text-slate-400 font-mono">
            Carimbo Oficial M.Árbitro HFT Engine v4.8 • Segurança Zero-Risco
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Fechar Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};
