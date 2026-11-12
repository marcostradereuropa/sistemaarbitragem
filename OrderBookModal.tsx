import React, { useState, useEffect } from 'react';
import { ArbitrageOpportunity, OrderBookResponse, TradeSimulationResult } from '../types/arbitrage';
import { fetchOrderBook, simulateArbitrageTrade } from '../services/api';
import { X, ArrowRight, ShieldCheck, AlertTriangle, Clock, CheckCircle2, TrendingUp, RefreshCw, Info } from 'lucide-react';

interface OrderBookModalProps {
  opportunity: ArbitrageOpportunity | null;
  onClose: () => void;
  defaultCapital: number;
}

export const OrderBookModal: React.FC<OrderBookModalProps> = ({
  opportunity,
  onClose,
  defaultCapital,
}) => {
  if (!opportunity) return null;

  const [capital, setCapital] = useState<number>(defaultCapital);
  const [buyBook, setBuyBook] = useState<OrderBookResponse | null>(null);
  const [sellBook, setSellBook] = useState<OrderBookResponse | null>(null);
  const [simulation, setSimulation] = useState<TradeSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(
    opportunity.bestNetwork?.networkId || opportunity.allMatchingNetworks[0]?.networkId || ''
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [bBook, sBook, sim] = await Promise.all([
        fetchOrderBook(opportunity.buyExchange, opportunity.symbol),
        fetchOrderBook(opportunity.sellExchange, opportunity.symbol),
        simulateArbitrageTrade({
          symbol: opportunity.symbol,
          buyExchange: opportunity.buyExchange,
          sellExchange: opportunity.sellExchange,
          capitalUsd: capital,
          networkId: selectedNetworkId,
        }),
      ]);
      setBuyBook(bBook);
      setSellBook(sBook);
      setSimulation(sim);
    } catch (err) {
      console.error('Error loading order books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [opportunity.id, capital, selectedNetworkId]);

  const activeNetwork =
    opportunity.allMatchingNetworks.find((n) => n.networkId === selectedNetworkId) ||
    opportunity.bestNetwork;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.001) return price.toFixed(6);
    return price.toFixed(8);
  };

  const buyStatus = activeNetwork?.statusByExchange[opportunity.buyExchange];
  const sellStatus = activeNetwork?.statusByExchange[opportunity.sellExchange];

  const isNetworkFullyActive =
    buyStatus?.withdrawal === 'ACTIVE' && sellStatus?.deposit === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold font-mono text-emerald-400 text-sm">
              {opportunity.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Raio-X de Arbitragem: {opportunity.pair}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {opportunity.buyExchange.toUpperCase()} → {opportunity.sellExchange.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conferência de livros de compra e venda, rede de transferência e lucratividade líquida
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Atualizar Livros e Simulação"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Capital Simulator Slider & Network Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            {/* Capital Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Capital para esta operação:</span>
                <span className="font-mono text-white font-bold text-sm">
                  ${capital.toLocaleString('en-US')} USD
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="25000"
                step="100"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>$100</span>
                <span>$5.000</span>
                <span>$10.000</span>
                <span>$25.000</span>
              </div>
            </div>

            {/* Network Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Selecione a Rede de Transferência:
              </label>
              <select
                value={selectedNetworkId}
                onChange={(e) => setSelectedNetworkId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              >
                {opportunity.allMatchingNetworks.map((net) => {
                  const bStatus = net.statusByExchange[opportunity.buyExchange]?.withdrawal;
                  const sStatus = net.statusByExchange[opportunity.sellExchange]?.deposit;
                  const isOk = bStatus === 'ACTIVE' && sStatus === 'ACTIVE';

                  return (
                    <option key={net.networkId} value={net.networkId}>
                      {net.networkName} — Taxa: ~${net.estimatedFeeUsd.toFixed(2)} ({isOk ? '100% Ativa' : 'Saque/Depósito Suspenso'})
                    </option>
                  );
                })}
              </select>
              {activeNetwork?.memoRequired && (
                <div className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Esta rede exige Tag / Memo obrigatório para depósito na {opportunity.sellExchange.toUpperCase()}!</span>
                </div>
              )}
            </div>
          </div>

          {/* Step-by-Step Route Verification Chain */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Conferência da Rota de Execução
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Buy */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Passo 1: Compra Spot</span>
                  <span className="font-semibold text-emerald-400">{opportunity.buyExchange.toUpperCase()}</span>
                </div>
                <div className="text-sm font-bold text-white font-mono tabular-nums">
                  ${formatPrice(simulation?.weightedBuyPrice || opportunity.buyPrice)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Taxa Taker (0.1%):</span>
                    <span className="font-mono">${(simulation?.buyTakerFeeUsd || capital * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moedas Compradas:</span>
                    <span className="font-mono text-slate-300">
                      {simulation?.coinsBought ? simulation.coinsBought.toFixed(4) : '--'} {opportunity.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slippage no Book:</span>
                    <span className="font-mono text-amber-400">
                      {simulation?.buySlippage ? `+${simulation.buySlippage.toFixed(2)}%` : '0.05%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Withdrawal on Buy Exchange */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Passo 2: Saque da Rede</span>
                  <span className="font-mono text-slate-300">{activeNetwork?.networkId || 'REDE'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {buyStatus?.withdrawal === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Saque Liberado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Saque Suspenso
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Taxa da Rede:</span>
                    <span className="font-mono text-rose-400">
                      ~${activeNetwork?.estimatedFeeUsd.toFixed(2) || '1.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo de Bloco:</span>
                    <span className="font-mono text-slate-300">
                      {activeNetwork?.avgConfirmationTime || '1 - 2 min'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mín. Saque:</span>
                    <span className="font-mono">{buyStatus?.minWithdrawal || 0} {opportunity.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Deposit on Sell Exchange */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Passo 3: Depósito</span>
                  <span className="font-semibold text-cyan-400">{opportunity.sellExchange.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {sellStatus?.deposit === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Depósito Liberado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Depósito Suspenso
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Taxa Depósito:</span>
                    <span className="font-mono text-emerald-400">$0.00 (Grátis)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moedas que Chegam:</span>
                    <span className="font-mono text-slate-300">
                      {simulation?.coinsArrived ? simulation.coinsArrived.toFixed(4) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tag / Memo:</span>
                    <span className={`font-mono ${activeNetwork?.memoRequired ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                      {activeNetwork?.memoRequired ? 'OBRIGATÓRIO' : 'Não exige'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Sell & Net Profit */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Passo 4: Venda &amp; Saldo</span>
                  <span className="font-semibold text-emerald-400">LUCRO REAL</span>
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
                  {simulation?.netProfitUsd !== undefined ? (
                    simulation.netProfitUsd > 0
                      ? `+$${simulation.netProfitUsd.toFixed(2)}`
                      : `-$${Math.abs(simulation.netProfitUsd).toFixed(2)}`
                  ) : (
                    `+$${opportunity.estimatedProfitUsd.toFixed(2)}`
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Retorno Líquido:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {simulation?.netRoiPct ? `+${simulation.netRoiPct.toFixed(2)}%` : `+${opportunity.estimatedNetSpreadPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Taxas:</span>
                    <span className="font-mono text-rose-400">
                      -${simulation?.totalFeesUsd ? simulation.totalFeesUsd.toFixed(2) : opportunity.transferFeeUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo Final:</span>
                    <span className="font-mono font-semibold text-white">
                      ${simulation?.finalCapitalUsd ? simulation.finalCapitalUsd.toFixed(2) : (capital + opportunity.estimatedProfitUsd).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Order Books Depth Side by Side */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Livros de Ofertas em Tempo Real (Profundidade &amp; Liquidez)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Top 8 níveis de ofertas · Preços reais direto das exchanges
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buy Book (Asks) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase">
                      {opportunity.buyExchange}
                    </span>
                    <span className="text-[11px] text-rose-400 font-medium">
                      Livro de Compra (Asks / Vendedores)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Melhor Ask: ${formatPrice(opportunity.buyPrice)}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="grid grid-cols-3 text-slate-400 text-[10px] pb-1 font-sans">
                    <span>Preço Ask ($)</span>
                    <span className="text-right">Qtd ({opportunity.symbol})</span>
                    <span className="text-right">Volume ($)</span>
                  </div>

                  {buyBook && buyBook.asks.length > 0 ? (
                    buyBook.asks.slice(0, 8).map((ask, idx) => {
                      const maxVol = Math.max(...buyBook.asks.slice(0, 8).map((a) => a.totalUsd));
                      const barWidth = Math.min(100, Math.max(5, (ask.totalUsd / maxVol) * 100));

                      return (
                        <div key={idx} className="relative grid grid-cols-3 py-0.5 px-1 rounded overflow-hidden">
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="text-rose-400 font-medium relative z-10">
                            ${formatPrice(ask.price)}
                          </span>
                          <span className="text-right text-slate-300 relative z-10 tabular-nums">
                            {ask.qty.toFixed(4)}
                          </span>
                          <span className="text-right text-slate-400 relative z-10 tabular-nums">
                            ${Math.round(ask.totalUsd).toLocaleString('en-US')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Carregando profundidade da {opportunity.buyExchange}...
                    </div>
                  )}
                </div>
              </div>

              {/* Sell Book (Bids) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase">
                      {opportunity.sellExchange}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Livro de Venda (Bids / Compradores)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Melhor Bid: ${formatPrice(opportunity.sellPrice)}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="grid grid-cols-3 text-slate-400 text-[10px] pb-1 font-sans">
                    <span>Preço Bid ($)</span>
                    <span className="text-right">Qtd ({opportunity.symbol})</span>
                    <span className="text-right">Volume ($)</span>
                  </div>

                  {sellBook && sellBook.bids.length > 0 ? (
                    sellBook.bids.slice(0, 8).map((bid, idx) => {
                      const maxVol = Math.max(...sellBook.bids.slice(0, 8).map((b) => b.totalUsd));
                      const barWidth = Math.min(100, Math.max(5, (bid.totalUsd / maxVol) * 100));

                      return (
                        <div key={idx} className="relative grid grid-cols-3 py-0.5 px-1 rounded overflow-hidden">
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="text-emerald-400 font-medium relative z-10">
                            ${formatPrice(bid.price)}
                          </span>
                          <span className="text-right text-slate-300 relative z-10 tabular-nums">
                            {bid.qty.toFixed(4)}
                          </span>
                          <span className="text-right text-slate-400 relative z-10 tabular-nums">
                            ${Math.round(bid.totalUsd).toLocaleString('en-US')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Carregando profundidade da {opportunity.sellExchange}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Feasibility Notice */}
          <div className={`p-4 rounded-xl border ${
            isNetworkFullyActive && (simulation?.netProfitUsd || opportunity.estimatedProfitUsd) > 0
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/20 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-start gap-3">
              {isNetworkFullyActive && (simulation?.netProfitUsd || opportunity.estimatedProfitUsd) > 0 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-white">
                  Diagnóstico de Execução:
                </div>
                <p className="leading-relaxed">
                  {isNetworkFullyActive
                    ? (simulation?.netProfitUsd || opportunity.estimatedProfitUsd) > 0
                      ? 'Operação 100% viável e lucrativa. Redes de saque e depósito abertas em ambas as pontas com spread líquido positivo.'
                      : 'Operação não lucrativa para este capital: o custo das taxas somadas ao slippage consome a margem de spread.'
                    : 'Atenção: A rede selecionada possui saques ou depósitos suspensos temporariamente em uma das corretoras.'}
                </p>
                <div className="text-[11px] opacity-80 pt-1">
                  Dica de Trader Pro: Se você já tiver saldo em USDT alocado em ambas as exchanges, você pode executar compra e venda simultaneamente sem esperar a transferência na blockchain!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Dados sincronizados em tempo real com os livros oficiais
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
          >
            Fechar Inspeção
          </button>
        </div>
      </div>
    </div>
  );
};
