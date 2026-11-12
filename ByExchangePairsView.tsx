import React, { useState, useMemo } from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';
import { OpportunityTicketCard } from './OpportunityTicketCard';
import { ArrowRight, ChevronDown, ChevronRight, Layers, ShieldCheck, Ticket, Sparkles, Building2 } from 'lucide-react';

interface ByExchangePairsViewProps {
  opportunities: ArbitrageOpportunity[];
  onOpenTicket: (opp: ArbitrageOpportunity) => void;
  onOpenOrderBook: (opp: ArbitrageOpportunity) => void;
  onOpenExecutionWizard: (opp: ArbitrageOpportunity) => void;
  selectedHousePair?: string;
  onSelectHousePair?: (pair: string | undefined) => void;
}

export const ByExchangePairsView: React.FC<ByExchangePairsViewProps> = ({
  opportunities,
  onOpenTicket,
  onOpenOrderBook,
  onOpenExecutionWizard,
  selectedHousePair,
  onSelectHousePair,
}) => {
  // Group opportunities by house pair: "buyExchange-sellExchange"
  const groupedPairs = useMemo(() => {
    const groups: Record<
      string,
      {
        buyExchange: string;
        sellExchange: string;
        opps: ArbitrageOpportunity[];
        approved100Count: number;
        bestNetSpreadPct: number;
        avgSafetyScore: number;
      }
    > = {};

    for (const opp of opportunities) {
      const key = `${opp.buyExchange.toLowerCase()}-${opp.sellExchange.toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          buyExchange: opp.buyExchange,
          sellExchange: opp.sellExchange,
          opps: [],
          approved100Count: 0,
          bestNetSpreadPct: -Infinity,
          avgSafetyScore: 0,
        };
      }
      groups[key].opps.push(opp);

      const is100 = opp.sacStatus === 'DISPONÍVEL' && 
                    opp.regStatus === 'DISPONÍVEL' && 
                    opp.networkStatus === 'ACTIVE' && 
                    (opp.netProfitFinalUsd ?? opp.estimatedProfitUsd) > 0;
      if (is100) groups[key].approved100Count++;

      const netPct = opp.netProfitFinalPct ?? opp.estimatedNetSpreadPct;
      if (netPct > groups[key].bestNetSpreadPct) {
        groups[key].bestNetSpreadPct = netPct;
      }
    }

    // Calculate averages & sort by best net spread
    const list = Object.entries(groups).map(([key, g]) => {
      const totalScore = g.opps.reduce((acc, o) => acc + o.safetyScore, 0);
      return {
        key,
        ...g,
        avgSafetyScore: Math.round(totalScore / g.opps.length),
      };
    });

    list.sort((a, b) => b.bestNetSpreadPct - a.bestNetSpreadPct);
    return list;
  }, [opportunities]);

  // Collapsible state for each pair (all expanded by default)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const exchangeColors: Record<string, string> = {
    binance: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    kucoin: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    bybit: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    okx: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    kraken: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    gate: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  };

  const getExchangeBadgeClass = (ex: string) =>
    exchangeColors[ex.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700';

  if (groupedPairs.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
        <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Nenhum par de corretoras disponível no momento</h3>
        <p className="text-xs text-slate-400 mt-1">
          Ajuste os filtros de corretoras ou spread para carregar novos pares de casas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* House Pair Quick Selector Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Separar por Casas (Corretoras de Origem e Destino)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {groupedPairs.length} rotas entre corretoras detectadas
          </span>
        </div>

        {/* Buttons to filter or jump to a specific house pair */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSelectHousePair && onSelectHousePair(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              !selectedHousePair
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            Todas as Casas ({opportunities.length} bilhetes)
          </button>

          {groupedPairs.map((g) => {
            const isSelected = selectedHousePair === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => onSelectHousePair && onSelectHousePair(isSelected ? undefined : g.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="uppercase font-bold">{g.buyExchange}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="uppercase font-bold">{g.sellExchange}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {g.opps.length}
                </span>
                {g.approved100Count > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${g.approved100Count} 100% Aprovados`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion / Sections per House Pair */}
      <div className="space-y-4">
        {groupedPairs
          .filter((g) => !selectedHousePair || g.key === selectedHousePair)
          .map((g) => {
            const isPairCollapsed = !!collapsed[g.key];

            return (
              <div
                key={g.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm"
              >
                {/* House Pair Banner Header */}
                <div
                  onClick={() => toggleCollapse(g.key)}
                  className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white transition-colors">
                      {isPairCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${getExchangeBadgeClass(g.buyExchange)}`}>
                        {g.buyExchange}
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${getExchangeBadgeClass(g.sellExchange)}`}>
                        {g.sellExchange}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {g.opps.length} {g.opps.length === 1 ? 'Bilhete' : 'Bilhetes'}
                      </span>
                      {g.approved100Count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                          ✨ {g.approved100Count} 100% Aprovados
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
                    <div>
                      <span className="text-slate-400 text-[10px] block sm:inline mr-1 font-sans">Melhor Spread:</span>
                      <span className="text-emerald-400 font-bold text-sm tabular-nums">
                        +{g.bestNetSpreadPct.toFixed(2)}% líq.
                      </span>
                    </div>

                    <div className="border-l border-slate-800 pl-3">
                      <span className="text-slate-400 text-[10px] block sm:inline mr-1 font-sans">Score Médio:</span>
                      <span className="text-slate-200 font-bold">
                        {g.avgSafetyScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tickets inside this house pair */}
                {!isPairCollapsed && (
                  <div className="p-4 bg-slate-950/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {g.opps.map((opp) => (
                        <OpportunityTicketCard
                          key={opp.id}
                          opportunity={opp}
                          onOpenTicket={onOpenTicket}
                          onOpenOrderBook={onOpenOrderBook}
                          onOpenExecutionWizard={onOpenExecutionWizard}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
