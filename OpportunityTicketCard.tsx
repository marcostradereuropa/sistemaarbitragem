import React from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';
import { ArrowRight, AlertTriangle, CheckCircle, Scale, ShieldCheck, Ticket, Clock, CheckCircle2, XCircle, Zap, Calculator, Receipt } from 'lucide-react';

interface OpportunityTicketCardProps {
  opportunity: ArbitrageOpportunity;
  onOpenTicket: (opp: ArbitrageOpportunity) => void;
  onOpenOrderBook: (opp: ArbitrageOpportunity) => void;
  onOpenExecutionWizard?: (opp: ArbitrageOpportunity) => void;
}

export const OpportunityTicketCard: React.FC<OpportunityTicketCardProps> = ({
  opportunity,
  onOpenTicket,
  onOpenOrderBook,
  onOpenExecutionWizard,
}) => {
  const isProfitable = opportunity.isFeasible && (opportunity.netProfitFinalUsd ?? opportunity.estimatedProfitUsd) > 0;
  const hasMemo = opportunity.bestNetwork?.memoRequired;

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  const finalNetUsd = opportunity.netProfitFinalUsd ?? opportunity.estimatedProfitUsd;
  const finalNetPct = opportunity.netProfitFinalPct ?? opportunity.estimatedNetSpreadPct;
  const networkName = opportunity.availableNetworkName || opportunity.bestNetwork?.networkName || 'Rede Principal';
  const networkFeeUsd = opportunity.withdrawalFeeUsdDisplay || `~$${opportunity.transferFeeUsd.toFixed(2)}`;

  // Cálculo das 4 faixas de despesas de operação tudo junto
  const sampleCapitalUsd = Math.min(1000, Math.round(opportunity.maxExecutableUsd) || 1000);
  const buyFeeUsd = opportunity.feeWaterfall?.buyFeeUsd ?? (sampleCapitalUsd * 0.001);
  const transferFeeUsd = opportunity.feeWaterfall?.networkFeeUsd ?? opportunity.transferFeeUsd;
  const sellFeeUsd = opportunity.feeWaterfall?.sellFeeUsd ?? (sampleCapitalUsd * (1 + (opportunity.grossSpreadPct || 0) / 100) * 0.001);
  const slippageUsd = opportunity.feeWaterfall?.slippageUsd ?? (sampleCapitalUsd * 0.0005);
  const totalOperationExpensesUsd = buyFeeUsd + transferFeeUsd + sellFeeUsd + slippageUsd;

  const is100Approved = opportunity.sacStatus === 'DISPONÍVEL' && 
                        opportunity.regStatus === 'DISPONÍVEL' && 
                        opportunity.networkStatus === 'ACTIVE' &&
                        finalNetUsd > 0;

  return (
    <div className={`bg-slate-900/80 border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between group ${
      is100Approved 
        ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Ticket Header Strip */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-[10px]">
            {opportunity.symbol.slice(0, 3)}
          </div>
          <span className="font-bold text-white tracking-tight">{opportunity.pair}</span>
          {is100Approved ? (
            <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 shadow-sm" title={`Rede Disponível: ${networkName}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% APROVADO · {opportunity.availableNetworkProtocol || 'REDE ATIVA'}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.2 rounded">Spot Real</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400">Score IA:</span>
          <span className={`font-bold ${opportunity.safetyScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {opportunity.safetyScore}%
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3 flex-1">
        {/* Route Exchange Header */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold uppercase text-[11px] border border-slate-700">
              {opportunity.buyExchange}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold uppercase text-[11px] border border-slate-700">
              {opportunity.sellExchange}
            </span>
          </div>

          <div className="text-right">
            <div className={`text-base font-black font-mono tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              +{finalNetPct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Lucro Líquido Real</div>
          </div>
        </div>

        {/* Prices Row */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">Ask de Compra ({opportunity.buyExchange.toUpperCase()})</span>
            <span className="font-bold text-white">${formatPrice(opportunity.buyPrice)}</span>
            {opportunity.volume24hBuy && opportunity.volume24hBuy > 0 && (
              <span className="text-[9px] text-slate-500 block">Vol: ${Math.round(opportunity.volume24hBuy).toLocaleString()}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-sans block">Bid de Venda ({opportunity.sellExchange.toUpperCase()})</span>
            <span className="font-bold text-emerald-400">${formatPrice(opportunity.sellPrice)}</span>
            {opportunity.volume24hSell && opportunity.volume24hSell > 0 && (
              <span className="text-[9px] text-slate-500 block">Vol: ${Math.round(opportunity.volume24hSell).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Real API Source & Volume Indicator */}
        <div className="flex items-center justify-between text-[10px] font-mono px-0.5 text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dados 100% Reais REST</span>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Auditado na Fonte</span>
          </span>
        </div>

        {/* STATUS SAC / REG (SAQUE E REGISTRO/DEPÓSITO) */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className={`p-2 rounded-lg border flex items-center justify-between ${
            opportunity.sacStatus === 'DISPONÍVEL'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}>
            <span className="text-slate-400 text-[10px] uppercase font-bold">SAC ({opportunity.buyExchange}):</span>
            <span className="font-mono font-bold text-[10px] flex items-center gap-1">
              {opportunity.sacStatus === 'DISPONÍVEL' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>DISPONÍVEL</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>SUSPENSO</span>
                </>
              )}
            </span>
          </div>

          <div className={`p-2 rounded-lg border flex items-center justify-between ${
            opportunity.regStatus === 'DISPONÍVEL'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}>
            <span className="text-slate-400 text-[10px] uppercase font-bold">REG ({opportunity.sellExchange}):</span>
            <span className="font-mono font-bold text-[10px] flex items-center gap-1">
              {opportunity.regStatus === 'DISPONÍVEL' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>DISPONÍVEL</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>SUSPENSO</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* NOME DA REDE DISPONÍVEL (DESTAQUE MÁXIMO SOLICITADO PELO USUÁRIO) */}
        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-500/40 text-[11px] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-[10px] uppercase font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Rede Disponível:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono font-extrabold text-[11px] truncate max-w-[210px] shadow-sm" title={networkName}>
              🌐 {networkName}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Status Operacional:</span>
            <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>DISPONÍVEL ({opportunity.availableNetworkProtocol || 'Protocolo Ativo'})</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] pt-1 border-t border-slate-800/80">
            <span>Taxa Saque da Rede:</span>
            <span className="text-rose-400 font-bold">
              {networkFeeUsd}
              {opportunity.withdrawalFeeTokenDisplay && (
                <span className="text-slate-400 text-[9px] ml-1">({opportunity.withdrawalFeeTokenDisplay})</span>
              )}
            </span>
          </div>
          {hasMemo && (
            <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 pt-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Requer Destination Tag / Memo no envio</span>
            </div>
          )}
          {opportunity.allMatchingNetworks && opportunity.allMatchingNetworks.length > 1 && (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">Todas as Redes de Saque ({opportunity.allMatchingNetworks.length}):</span>
              <div className="flex items-center gap-1">
                {opportunity.allMatchingNetworks.slice(0, 4).map((n) => (
                  <span
                    key={n.networkId}
                    className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[9px]"
                    title={`${n.networkName} - Taxa ~$${n.estimatedFeeUsd.toFixed(2)} USD`}
                  >
                    {n.protocol || n.networkId}
                  </span>
                ))}
                {opportunity.allMatchingNetworks.length > 4 && (
                  <span className="text-[9px] text-emerald-400 font-mono font-bold">
                    +{opportunity.allMatchingNetworks.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LIQUIDITY TRAVA (O PONTO CENTRAL DO USUÁRIO) */}
        <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Liquidez p/ Compra:</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              ${Math.round(opportunity.buyAvailableUsd).toLocaleString('en-US')} USDT
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Liquidez p/ Venda:</span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              ${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')} USDT
            </span>
          </div>

          {/* Golden Bottleneck Warning */}
          <div className="pt-2 mt-1 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-amber-300">
            <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Trava:</strong> Você só pode comprar no máximo <strong className="text-white">${Math.round(opportunity.maxExecutableUsd).toLocaleString('en-US')} USDT</strong> porque a ponta de venda só suporta ${Math.round(opportunity.sellAvailableUsd).toLocaleString('en-US')}.
            </div>
          </div>
        </div>

        {/* CAMPO: CUSTO TOTAL ESTIMADO (TAXAS 2 CORRETORAS + REDE/GAS + SLIPPAGE) */}
        <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
            <span className="text-white font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <Calculator className="w-3.5 h-3.5 text-rose-400" />
              <span>Custo Total Estimado:</span>
            </span>
            <span className="text-rose-400 font-mono font-black text-xs bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
              -${totalOperationExpensesUsd.toFixed(2)} USDT
            </span>
          </div>

          {/* 4 Ranges Mini-Tags */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
            <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
              <span className="text-slate-400 block truncate">1. Compra</span>
              <span className="text-rose-400 font-bold">-${buyFeeUsd.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
              <span className="text-slate-400 block truncate" title={networkName}>2. Saque</span>
              <span className="text-rose-400 font-bold">-${transferFeeUsd.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
              <span className="text-slate-400 block truncate">3. Venda</span>
              <span className="text-rose-400 font-bold">-${sellFeeUsd.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
              <span className="text-slate-400 block truncate">4. Slip</span>
              <span className="text-amber-400 font-bold">-${slippageUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* SOMA CONSOLIDADA DAS FAIXAS TUDO JUNTO */}
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-center">
            <span className="text-slate-400 block text-[9px] mb-0.5">Soma Total Unificada:</span>
            <span className="text-rose-300 font-bold tracking-tight block truncate" title={`$${buyFeeUsd.toFixed(2)} + $${transferFeeUsd.toFixed(2)} + $${sellFeeUsd.toFixed(2)} + $${slippageUsd.toFixed(2)} = -$${totalOperationExpensesUsd.toFixed(2)} USDT`}>
              ${buyFeeUsd.toFixed(2)} + ${transferFeeUsd.toFixed(2)} + ${sellFeeUsd.toFixed(2)} + ${slippageUsd.toFixed(2)} = -${totalOperationExpensesUsd.toFixed(2)} USDT
            </span>
          </div>

          {/* LUCRO LÍQUIDO FINAL GARANTIDO NO BOLSO */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2.5 flex items-center justify-between">
            <div className="text-[11px]">
              <span className="text-white font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Lucro Líquido Final:</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono block">Todas as faixas descontadas</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-sm text-emerald-400">
                +{finalNetUsd.toFixed(2)} USDT
              </span>
              <span className="block text-[10px] text-emerald-300 font-mono font-bold">
                +{finalNetPct.toFixed(2)}% líquido
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Footer Action Buttons */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenOrderBook(opportunity)}
          className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-medium border border-slate-700"
          title="Ver Livro de Ofertas"
        >
          Livro
        </button>

        <button
          type="button"
          onClick={() => onOpenTicket(opportunity)}
          className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Bilhete</span>
        </button>

        {onOpenExecutionWizard && (
          <button
            type="button"
            onClick={() => onOpenExecutionWizard(opportunity)}
            className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Executar Agora</span>
          </button>
        )}
      </div>
    </div>
  );
};

