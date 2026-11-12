import React, { useState, useEffect } from 'react';
import { fetchOrderBook, simulateArbitrageTrade, fetchAllNetworks } from '../services/api';
import { OrderBookResponse, TradeSimulationResult, AssetNetworks } from '../types/arbitrage';
import { ArrowRight, RefreshCw, ShieldCheck, AlertTriangle, Calculator, Clock, Layers } from 'lucide-react';

export const InteractiveSimulatorView: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('SOL');
  const [buyExchange, setBuyExchange] = useState<string>('binance');
  const [sellExchange, setSellExchange] = useState<string>('bybit');
  const [capitalUsd, setCapitalUsd] = useState<number>(2000);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [networksDb, setNetworksDb] = useState<Record<string, AssetNetworks>>({});

  const [buyBook, setBuyBook] = useState<OrderBookResponse | null>(null);
  const [sellBook, setSellBook] = useState<OrderBookResponse | null>(null);
  const [simulation, setSimulation] = useState<TradeSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const POPULAR_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'SUI', 'LINK', 'PEPE', 'NEAR', 'BNB'];
  const EXCHANGES = ['binance', 'kucoin', 'okx', 'gate', 'kraken'];

  useEffect(() => {
    fetchAllNetworks().then((db) => {
      setNetworksDb(db);
    });
  }, []);

  const currentAsset = networksDb[symbol];

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const [bBook, sBook, sim] = await Promise.all([
        fetchOrderBook(buyExchange, symbol),
        fetchOrderBook(sellExchange, symbol),
        simulateArbitrageTrade({
          symbol,
          buyExchange,
          sellExchange,
          capitalUsd,
          networkId: selectedNetworkId,
        }),
      ]);
      setBuyBook(bBook);
      setSellBook(sBook);
      setSimulation(sim);
    } catch (err) {
      console.error('Failed to simulate trade:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [symbol, buyExchange, sellExchange, capitalUsd, selectedNetworkId]);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    if (p >= 0.001) return p.toFixed(6);
    return p.toFixed(8);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Simulador Avançado de Arbitragem com Profundidade de Livro
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Escolha qualquer par e corretoras para analisar a absorção de liquidez do livro em tempo real, calculando slippage, taxa de saque e lucro líquido exato.
          </p>
        </div>

        {/* Quick Asset Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-2">Cripto:</span>
          {POPULAR_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSymbol(s);
                setSelectedNetworkId('');
              }}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors ${
                symbol === s
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Setup Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800/60">
          {/* Buy Exchange */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Corretora de Compra:
            </label>
            <select
              value={buyExchange}
              onChange={(e) => setBuyExchange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase font-medium focus:outline-none focus:border-emerald-500"
            >
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex} disabled={ex === sellExchange}>
                  {ex.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sell Exchange */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Corretora de Venda:
            </label>
            <select
              value={sellExchange}
              onChange={(e) => setSellExchange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase font-medium focus:outline-none focus:border-emerald-500"
            >
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex} disabled={ex === buyExchange}>
                  {ex.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Capital da Operação (USD):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
              <input
                type="number"
                min="100"
                step="100"
                value={capitalUsd}
                onChange={(e) => setCapitalUsd(Math.max(10, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Network Route */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Rede de Transferência:
            </label>
            <select
              value={selectedNetworkId}
              onChange={(e) => setSelectedNetworkId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="">Automática (Menor Taxa)</option>
              {currentAsset?.networks.map((n) => (
                <option key={n.networkId} value={n.networkId}>
                  {n.networkName} (~${n.estimatedFeeUsd.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Simulation Results & Financial Waterfall */}
      {simulation && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Resultado da Simulação com Dados Reais
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-white">
                  ${simulation.finalCapitalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
                <span
                  className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                    simulation.isProfitable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {simulation.netRoiPct > 0 ? `+${simulation.netRoiPct.toFixed(2)}%` : `${simulation.netRoiPct.toFixed(2)}%`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Lucro Líquido Real:</span>
              <div
                className={`text-xl font-bold font-mono tabular-nums ${
                  simulation.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {simulation.netProfitUsd > 0
                  ? `+$${simulation.netProfitUsd.toFixed(2)} USD`
                  : `-$${Math.abs(simulation.netProfitUsd).toFixed(2)} USD`}
              </div>
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            {/* Step 1 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="text-slate-400 font-sans font-semibold flex items-center justify-between">
                <span>1. Compra ({simulation.buyExchange.toUpperCase()})</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Capital alocado:</span>
                  <span>${simulation.capitalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Taxa Taker:</span>
                  <span className="text-rose-400">-${simulation.buyTakerFeeUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Preço Médio (VWAP):</span>
                  <span>${formatPrice(simulation.weightedBuyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Slippage:</span>
                  <span className="text-amber-400">+{simulation.buySlippage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span className="font-sans">Moedas obtidas:</span>
                  <span>{simulation.coinsBought.toFixed(4)} {simulation.symbol}</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="text-slate-400 font-sans font-semibold flex items-center justify-between">
                <span>2. Saque da Rede</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Rede usada:</span>
                  <span className="text-emerald-400 font-bold">{simulation.networkUsed?.networkName || 'Blockchain'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Taxa da Rede ($):</span>
                  <span className="text-rose-400">-${simulation.transferFeeUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Taxa em Moedas:</span>
                  <span className="text-slate-400">-{simulation.networkFeeCoins} {simulation.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Tempo de Bloco:</span>
                  <span>{simulation.networkUsed?.avgConfirmationTime || '1 min'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span className="font-sans">Moedas recebidas:</span>
                  <span>{simulation.coinsArrived.toFixed(4)} {simulation.symbol}</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="text-slate-400 font-sans font-semibold flex items-center justify-between">
                <span>3. Venda ({simulation.sellExchange.toUpperCase()})</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Preço Médio (VWAP):</span>
                  <span>${formatPrice(simulation.weightedSellPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Slippage Venda:</span>
                  <span className="text-amber-400">-{simulation.sellSlippage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Receita Bruta:</span>
                  <span>${simulation.receivedUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Taxa Taker:</span>
                  <span className="text-rose-400">-${simulation.sellTakerFeeUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span className="font-sans">Líquido Venda:</span>
                  <span>${(simulation.receivedUsd - simulation.sellTakerFeeUsd).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="text-slate-400 font-sans font-semibold flex items-center justify-between">
                <span>4. Resumo Financeiro</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Total de Taxas:</span>
                  <span className="text-rose-400 font-bold">-${simulation.totalFeesUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Investimento Inicial:</span>
                  <span>${simulation.capitalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Capital Final:</span>
                  <span className="text-white font-bold">${simulation.finalCapitalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span className="font-sans">Lucro Líquido:</span>
                  <span className={simulation.isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                    {simulation.netProfitUsd > 0 ? `+$${simulation.netProfitUsd.toFixed(2)}` : `-$${Math.abs(simulation.netProfitUsd).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Books Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buy Book */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <span>{buyExchange}</span>
              <span className="text-rose-400 font-normal">· Asks (Vendedores)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Melhor Ask: ${formatPrice(buyBook?.asks[0]?.price || 0)}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            <div className="grid grid-cols-3 text-slate-400 text-[10px] pb-1 font-sans">
              <span>Preço ($)</span>
              <span className="text-right">Qtd ({symbol})</span>
              <span className="text-right">Volume ($)</span>
            </div>
            {buyBook?.asks.slice(0, 7).map((ask, i) => (
              <div key={i} className="grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/40">
                <span className="text-rose-400 font-medium">${formatPrice(ask.price)}</span>
                <span className="text-right text-slate-300 tabular-nums">{ask.qty.toFixed(4)}</span>
                <span className="text-right text-slate-400 tabular-nums">${Math.round(ask.totalUsd).toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Book */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <span>{sellExchange}</span>
              <span className="text-emerald-400 font-normal">· Bids (Compradores)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Melhor Bid: ${formatPrice(sellBook?.bids[0]?.price || 0)}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            <div className="grid grid-cols-3 text-slate-400 text-[10px] pb-1 font-sans">
              <span>Preço ($)</span>
              <span className="text-right">Qtd ({symbol})</span>
              <span className="text-right">Volume ($)</span>
            </div>
            {sellBook?.bids.slice(0, 7).map((bid, i) => (
              <div key={i} className="grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/40">
                <span className="text-emerald-400 font-medium">${formatPrice(bid.price)}</span>
                <span className="text-right text-slate-300 tabular-nums">{bid.qty.toFixed(4)}</span>
                <span className="text-right text-slate-400 tabular-nums">${Math.round(bid.totalUsd).toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
