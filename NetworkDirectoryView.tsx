import React, { useState, useEffect } from 'react';
import { fetchAllNetworks } from '../services/api';
import { AssetNetworks } from '../types/arbitrage';
import { Search, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert, Network, ArrowRight } from 'lucide-react';

export const NetworkDirectoryView: React.FC = () => {
  const [networksDb, setNetworksDb] = useState<Record<string, AssetNetworks>>({});
  const [search, setSearch] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');

  useEffect(() => {
    fetchAllNetworks().then(setNetworksDb);
  }, []);

  const exchanges = ['binance', 'bybit', 'okx', 'gate', 'kraken'];

  const filteredAssets = Object.values(networksDb).filter((asset) => {
    const matchesSearch =
      asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedProtocol !== 'ALL') {
      return asset.networks.some((n) => n.networkId.includes(selectedProtocol) || n.protocol.includes(selectedProtocol));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              Diretório de Redes de Transferência &amp; Taxas de Saque
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Verifique a disponibilidade operacional de depósitos e saques em cada exchange, tempo médio de bloco, taxa cobrada e alertas de Memo/Tag obrigatório para nunca ter fundos bloqueados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar moeda (BTC, SOL, USDT...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="space-y-6">
        {filteredAssets.map((asset) => (
          <div key={asset.symbol} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                  {asset.symbol}
                </div>
                <div>
                  <span className="font-bold text-white text-sm tracking-tight">{asset.name}</span>
                  <span className="text-xs text-slate-400 ml-2 font-mono">({asset.symbol})</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {asset.networks.length} rede(s) suportada(s)
              </div>
            </div>

            <div className="divide-y divide-slate-800/40">
              {asset.networks.map((net) => (
                <div key={net.networkId} className="p-4 sm:p-5 hover:bg-slate-850/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Network Info */}
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">
                          {net.networkName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {net.protocol}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {net.avgConfirmationTime}
                        </span>
                        <span>·</span>
                        <span className="text-slate-300 font-medium">
                          Taxa média: ~${net.estimatedFeeUsd.toFixed(2)} USD ({net.withdrawalFeeTokens} {asset.symbol})
                        </span>
                      </div>

                      {net.memoRequired && (
                        <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded max-w-fit">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Destination Tag / Memo obrigatório no depósito!</span>
                        </div>
                      )}
                    </div>

                    {/* Status by Exchange Matrix */}
                    <div className="flex flex-wrap items-center gap-2">
                      {exchanges.map((ex) => {
                        const status = net.statusByExchange[ex];
                        if (!status) {
                          return (
                            <div key={ex} className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500">
                              <span className="font-semibold uppercase">{ex}</span>: Não suporta
                            </div>
                          );
                        }

                        const isDepositActive = status.deposit === 'ACTIVE';
                        const isWithdrawActive = status.withdrawal === 'ACTIVE';
                        const isBothActive = isDepositActive && isWithdrawActive;

                        return (
                          <div
                            key={ex}
                            className={`px-3 py-1.5 rounded-lg border text-xs flex flex-col gap-0.5 ${
                              isBothActive
                                ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold uppercase text-[11px]">{ex}</span>
                              {isBothActive ? (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  100% Ativo
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  {!isWithdrawActive ? 'Saque Off' : 'Depósito Off'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Taxa: {status.fee > 0 ? `${status.fee} ${asset.symbol}` : 'Grátis'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
