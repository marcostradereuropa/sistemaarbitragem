import React from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle, ChevronRight, Clock, ShieldCheck } from 'lucide-react';

interface OpportunityTableProps {
  opportunities: ArbitrageOpportunity[];
  capitalUsd: number;
  onSelectOpportunity: (opp: ArbitrageOpportunity) => void;
  onOpenTicket: (opp: ArbitrageOpportunity) => void;
  onOpenExecutionWizard?: (opp: ArbitrageOpportunity) => void;
  isLoading: boolean;
}

export const OpportunityTable: React.FC<OpportunityTableProps> = ({
  opportunities,
  capitalUsd,
  onSelectOpportunity,
  onOpenTicket,
  onOpenExecutionWizard,
  isLoading,
}) => {
  if (isLoading && opportunities.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
        <h3 className="text-base font-semibold text-white">Carregando dados das corretoras em tempo real...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Consultando livros de oferta e status de rede na Binance, Bybit, OKX, Kraken e Gate.io.
        </p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Nenhuma oportunidade com os filtros atuais</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Tente diminuir o spread mínimo exigido ou habilitar mais corretoras para encontrar novas rotas de arbitragem.
        </p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.001) return price.toFixed(6);
    return price.toFixed(8);
  };

  const getExchangeBadge = (exchange: string) => {
    const colors: Record<string, string> = {
      binance: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      kucoin: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      bybit: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
      okx: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      kraken: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      gate: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    };
    return colors[exchange.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 font-medium tracking-wide">
              <th className="py-3 px-4">Par / Ativo</th>
              <th className="py-3 px-4">Comprar em (Ask)</th>
              <th className="py-3 px-4">Vender em (Bid)</th>
              <th className="py-3 px-4 text-right">Spread Bruto</th>
              <th className="py-3 px-4">Trava de Liquidez</th>
              <th className="py-3 px-4">Nome da Rede Disponível</th>
              <th className="py-3 px-4 text-center">Status SAC / REG</th>
              <th className="py-3 px-4 text-right">Taxa Saque</th>
              <th className="py-3 px-4 text-right">Lucro Líquido Final</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {opportunities.map((opp) => {
              const finalProfit = opp.netProfitFinalUsd ?? opp.estimatedProfitUsd;
              const finalPct = opp.netProfitFinalPct ?? opp.estimatedNetSpreadPct;
              const isProfitable = opp.isFeasible && finalProfit > 0;
              const hasMemo = opp.bestNetwork?.memoRequired;

              return (
                <tr
                  key={opp.id}
                  className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() => onOpenTicket(opp)}
                >
                  {/* Par / Ativo */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold font-mono text-[11px] text-white">
                        {opp.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-white tracking-tight">{opp.pair}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Spot Real</div>
                      </div>
                    </div>
                  </td>

                  {/* Compra */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getExchangeBadge(opp.buyExchange)}`}>
                          {opp.buyExchange.toUpperCase()}
                        </span>
                        <span className="font-mono tabular-nums text-slate-100 font-medium">
                          ${formatPrice(opp.buyPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Liq Ask: ${Math.round(opp.buyAvailableUsd).toLocaleString('en-US')}
                      </span>
                    </div>
                  </td>

                  {/* Venda */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getExchangeBadge(opp.sellExchange)}`}>
                          {opp.sellExchange.toUpperCase()}
                        </span>
                        <span className="font-mono tabular-nums text-slate-100 font-medium">
                          ${formatPrice(opp.sellPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Liq Bid: ${Math.round(opp.sellAvailableUsd).toLocaleString('en-US')}
                      </span>
                    </div>
                  </td>

                  {/* Spread Bruto */}
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums">
                    <span className={`font-semibold ${opp.grossSpreadPct > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {opp.grossSpreadPct > 0 ? `+${opp.grossSpreadPct.toFixed(2)}%` : `${opp.grossSpreadPct.toFixed(2)}%`}
                    </span>
                  </td>

                  {/* Trava de Liquidez (O ponto do usuário) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-slate-400">Compre até:</span>
                        <span className="font-bold text-amber-300">
                          ${Math.round(opp.maxExecutableUsd).toLocaleString('en-US')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {opp.liquidityBottleneck === 'SELL_SIDE' ? 'Gargalo no Bid de venda' : 'Livro balanceado'}
                      </span>
                    </div>
                  </td>

                  {/* Nome da Rede Disponível */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {opp.availableNetworkName || opp.bestNetwork ? (
                      <div className="flex flex-col">
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>{opp.availableNetworkName || opp.bestNetwork?.networkName}</span>
                        </div>
                        <span className="text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                          <span className="text-emerald-400 font-bold">DISPONÍVEL</span>
                          <span>·</span>
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          {opp.bestNetwork?.avgConfirmationTime || '1 - 2 min'}
                          {hasMemo && <span className="text-amber-400 font-bold ml-1">· Tag Obrigatória</span>}
                        </span>
                      </div>
                    ) : (
                      <span className="text-rose-400 text-xs">Sem rota compatível</span>
                    )}
                  </td>

                  {/* Status SAC / REG */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1 font-mono text-[10px]">
                      <span className={`px-2 py-0.5 rounded border font-bold ${opp.sacStatus === 'DISPONÍVEL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        SAC: {opp.sacStatus || 'DISPONÍVEL'}
                      </span>
                      <span className={`px-2 py-0.5 rounded border font-bold ${opp.regStatus === 'DISPONÍVEL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        REG: {opp.regStatus || 'DISPONÍVEL'}
                      </span>
                    </div>
                  </td>

                  {/* Taxa de Saque */}
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums">
                    <span className="text-slate-200 font-medium">
                      {opp.withdrawalFeeUsdDisplay || `~$${opp.transferFeeUsd.toFixed(2)}`}
                    </span>
                    {opp.bestNetwork && (
                      <div className="text-[10px] text-slate-400">
                        {opp.withdrawalFeeTokenDisplay || `${opp.bestNetwork.withdrawalFeeTokens} ${opp.symbol}`}
                      </div>
                    )}
                  </td>

                  {/* Lucro Líquido Final Já Descontado */}
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums">
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-sm font-bold ${
                          isProfitable
                            ? 'text-emerald-400'
                            : finalProfit < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {finalProfit > 0
                          ? `+$${finalProfit.toFixed(2)}`
                          : `-$${Math.abs(finalProfit).toFixed(2)}`}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isProfitable
                            ? 'text-emerald-500 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {finalPct > 0 ? `+${finalPct.toFixed(2)}%` : `${finalPct.toFixed(2)}%`} líq.
                      </span>
                    </div>
                  </td>

                  {/* Ação */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {onOpenExecutionWizard && (
                        <button
                          type="button"
                          onClick={() => onOpenExecutionWizard(opp)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-sm"
                          title="Executar Arbitragem Passo a Passo"
                        >
                          Executar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenTicket(opp)}
                        className="px-2 py-1 text-[11px] font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                      >
                        Bilhete
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectOpportunity(opp)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-white rounded border border-slate-800 transition-colors"
                        title="Ver Livro de Ofertas"
                      >
                        Livro
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>Exibindo <strong>{opportunities.length}</strong> rotas calculadas</span>
          <span aria-hidden="true">·</span>
          <span>Capital base: <strong>${capitalUsd.toLocaleString('en-US')}</strong></span>
        </div>
        <div className="text-[11px] text-slate-400">
          Lucro líquido deduz: taxa taker compra (0.1%) + taxa de rede + taxa taker venda (0.1%) + slippage do book.
        </div>
      </div>
    </div>
  );
};
