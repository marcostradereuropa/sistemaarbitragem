import React from 'react';
import { Search, DollarSign, SlidersHorizontal, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import { ScannerFilterState } from '../types/arbitrage';

interface FilterControlsProps {
  filter: ScannerFilterState;
  setFilter: React.Dispatch<React.SetStateAction<ScannerFilterState>>;
  availableExchanges: string[];
  approved100Count?: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  setFilter,
  availableExchanges,
  approved100Count = 0,
}) => {
  const CAPITAL_PRESETS = [500, 1000, 2500, 5000, 10000];
  const allExchanges = ['binance', 'coinbase', 'kraken', 'bybit', 'bitget', 'kucoin', 'okx', 'gate', 'bitfinex', 'mexc', 'htx'];

  const toggleExchange = (ex: string) => {
    setFilter((prev) => {
      const exists = prev.selectedExchanges.includes(ex);
      let updated: string[];
      if (exists) {
        if (prev.selectedExchanges.length === 1) return prev; // Keep at least one
        updated = prev.selectedExchanges.filter((e) => e !== ex);
      } else {
        updated = [...prev.selectedExchanges, ex];
      }
      return { ...prev, selectedExchanges: updated };
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Top Row: Search + Capital Preset + Quick 100% Approved Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Buscar cripto (ex: BTC, SOL, XRP, DOGE, SUI, PEPE...)"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
          />
        </div>

        {/* 100% APPROVED QUICK SELECTOR BUTTON (USER'S EXPLICIT REQUEST) */}
        <button
          type="button"
          onClick={() => setFilter((prev) => ({ ...prev, only100PercentApproved: !prev.only100PercentApproved }))}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
            filter.only100PercentApproved
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-emerald-500/20 ring-1 ring-emerald-500/50'
              : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-white'
          }`}
          title="Filtra apenas bilhetes com SAC liberado, REG liberado, Rede ativa e Lucro Líquido Real já garantido"
        >
          <div className={`w-2 h-2 rounded-full ${filter.only100PercentApproved ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span>💎 Bilhetes 100% Aprovados</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            filter.only100PercentApproved ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
          }`}>
            {approved100Count}
          </span>
        </button>

        {/* Capital Simulator Input */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Capital de Teste:
          </span>
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
            {CAPITAL_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter((prev) => ({ ...prev, capitalUsd: val }))}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                  filter.capitalUsd === val
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ${val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
            <div className="pl-1 pr-2 flex items-center">
              <span className="text-slate-500 text-xs mr-1">$</span>
              <input
                type="number"
                min="50"
                step="50"
                value={filter.capitalUsd}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    setFilter((prev) => ({ ...prev, capitalUsd: val }));
                  }
                }}
                className="w-16 bg-transparent text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Row: Memecoins, Altcoins, L1/L2, DeFi & Lucrative Spreads */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">Categoria:</span>
          {[
            { id: 'ALL', label: '🔥 Todas' },
            { id: 'MEME', label: '🐕 Memecoins & Shitcoins' },
            { id: 'ALTCOIN', label: '⚡ Altcoins em Alta' },
            { id: 'L1_L2', label: '💎 Redes L1 & L2' },
            { id: 'DEFI', label: '🏦 Protocolos DeFi' },
          ].map((cat) => {
            const isSelected = (filter.selectedCategory || 'ALL') === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter((prev) => ({ ...prev, selectedCategory: cat.id }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* High Profit Spreads Toggle (>2.5%) */}
        <button
          type="button"
          onClick={() => setFilter((prev) => ({ ...prev, onlyHighProfit: !prev.onlyHighProfit }))}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
            filter.onlyHighProfit
              ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-1 ring-purple-500/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-purple-500/40 hover:text-purple-300'
          }`}
          title="Filtra oportunidades com spread líquido acima de 2.5%"
        >
          <span>🚀 Spreads Mais Lucrativos (&gt;2.5%)</span>
        </button>
      </div>

      {/* Bottom Row: Exchange Toggles & 3-Way Mode Switcher (Casas vs Bilhetes vs Tabela) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-800/60">
        {/* Exchange Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Corretoras:
          </span>
          {allExchanges.map((ex) => {
            const isSelected = filter.selectedExchanges.includes(ex);
            return (
              <button
                key={ex}
                type="button"
                onClick={() => toggleExchange(ex)}
                className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wide rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                    : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
                }`}
              >
                {ex}
              </button>
            );
          })}
        </div>

        {/* View Switcher: Bilhetes e Bilhetes | Separar por Casas | Tabela Geral */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Minimum Spread Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1">
            <span>Spread Mín:</span>
            <select
              value={filter.minNetSpreadPct}
              onChange={(e) => setFilter((prev) => ({ ...prev, minNetSpreadPct: parseFloat(e.target.value) }))}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
            >
              <option value={-1} className="bg-slate-900 text-slate-200">Todos</option>
              <option value={0} className="bg-slate-900 text-slate-200">&gt; 0.0% (Líquido)</option>
              <option value={0.5} className="bg-slate-900 text-slate-200">&gt; 0.5%</option>
              <option value={1.0} className="bg-slate-900 text-slate-200">&gt; 1.0%</option>
              <option value={2.0} className="bg-slate-900 text-slate-200">&gt; 2.0%</option>
              <option value={3.0} className="bg-slate-900 text-slate-200">&gt; 3.0%</option>
            </select>
          </div>

          {/* 3-Way Mode Segmented Control Requested by User */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, viewMode: 'tickets' }))}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filter.viewMode === 'tickets'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em cartões de bilhetes oficiais"
            >
              <span>🎫 Bilhetes e Bilhetes</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, viewMode: 'by_exchange_pairs' }))}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filter.viewMode === 'by_exchange_pairs'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Separar oportunidades pelos pares de corretoras parceiras"
            >
              <span>🏛️ Separar por Casas</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, viewMode: 'table' }))}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filter.viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em tabela analítica completa"
            >
              <span>📊 Tabela Geral</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
