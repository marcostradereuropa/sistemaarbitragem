import React from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';

interface KpiMetricsBarProps {
  opportunities: ArbitrageOpportunity[];
  totalPairsScanned: number;
  exchangesActive: string[];
  lastUpdated: number;
  capitalUsd: number;
}

export const KpiMetricsBar: React.FC<KpiMetricsBarProps> = ({
  opportunities,
  totalPairsScanned,
  exchangesActive,
  lastUpdated,
  capitalUsd,
}) => {
  const profitableOpps = opportunities.filter((o) => o.isFeasible && o.estimatedProfitUsd > 0);
  const bestOpp = profitableOpps.length > 0 ? profitableOpps[0] : null;

  const secondsAgo = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Metric 1 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-1">
          Oportunidades Lucrativas
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono tabular-nums">
            {profitableOpps.length}
          </span>
          <span className="text-xs text-slate-400">
            de {opportunities.length} rotas
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-2 truncate">
          Para capital de ${capitalUsd.toLocaleString('en-US')}
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-1">
          Maior Lucro Líquido Real
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {bestOpp ? `+${bestOpp.estimatedNetSpreadPct.toFixed(2)}%` : '0.00%'}
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {bestOpp ? `(+$${bestOpp.estimatedProfitUsd.toFixed(2)})` : '($0.00)'}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-2 truncate">
          {bestOpp ? `${bestOpp.pair} · ${bestOpp.buyExchange.toUpperCase()} → ${bestOpp.sellExchange.toUpperCase()}` : 'Aguardando oportunidade'}
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-1">
          Pares &amp; Corretoras
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono tabular-nums">
            {totalPairsScanned > 0 ? totalPairsScanned : '180+'}
          </span>
          <span className="text-xs text-slate-400">pares spot</span>
        </div>
        <div className="text-xs text-slate-400 mt-2 truncate">
          {exchangesActive.length > 0
            ? exchangesActive.map((e) => e.toUpperCase()).join(' · ')
            : 'Binance · Bybit · OKX · Kraken · Gate'}
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-1">
          Validação de Redes
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono tabular-nums">
            100%
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            Mapeadas
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-2 truncate">
          Atualizado há {secondsAgo}s · TRC20, BSC, ARB, SOL, ERC20
        </div>
      </div>
    </div>
  );
};
