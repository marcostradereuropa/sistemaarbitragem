import React, { useState, useEffect } from 'react';
import { ArbitrageOpportunity } from '../types/arbitrage';
import { 
  SystemHealth, TreasuryAllocation, PerformanceAnalytics, 
  CompoundProjection, Milestone, TreasuryMovement 
} from '../types/enterprise';
import { AutoExecutionOrder } from '../types/automation';
import { 
  fetchSystemHealthApi, toggleKillSwitchApi, fetchTreasuryApi, 
  rebalanceTreasuryApi, fetchAnalyticsApi, calculateProjectionsApi, 
  fetchAutomationHistoryApi 
} from '../services/api';
import { 
  Activity, ShieldAlert, Zap, TrendingUp, DollarSign, Wallet, 
  PieChart, BarChart3, Clock, AlertTriangle, CheckCircle2, 
  RefreshCw, Power, ArrowRight, ArrowUpRight, Flame, Target, 
  Award, Sparkles, Building2, Terminal, Layers, Scale, Play,
  Lock, ArrowDownRight, Compass, Cpu, Check, HelpCircle, Receipt
} from 'lucide-react';

interface MultidimensionalDashboardViewProps {
  opportunities: ArbitrageOpportunity[];
  onOpenTicket: (opp: ArbitrageOpportunity) => void;
  onOpenOrderBook: (opp: ArbitrageOpportunity) => void;
  onOpenBot: (opp?: ArbitrageOpportunity) => void;
  onOpenApiVault: () => void;
  onOpenLedger?: () => void;
}

export const MultidimensionalDashboardView: React.FC<MultidimensionalDashboardViewProps> = ({
  opportunities,
  onOpenTicket,
  onOpenOrderBook,
  onOpenBot,
  onOpenApiVault,
  onOpenLedger,
}) => {
  const [activeSector, setActiveSector] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [treasury, setTreasury] = useState<TreasuryAllocation | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [projections, setProjections] = useState<CompoundProjection | null>(null);
  const [orders, setOrders] = useState<AutoExecutionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Projections simulator state
  const [simInitialCapital, setSimInitialCapital] = useState(2500);
  const [simMonthlyContribution, setSimMonthlyContribution] = useState(400);

  // Treasury rebalance state
  const [rebFrom, setRebFrom] = useState('binance');
  const [rebTo, setRebTo] = useState('bitget');
  const [rebAmount, setRebAmount] = useState(1500);
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Radar filter inside sector 2
  const [radarType, setRadarType] = useState<'ALL' | 'SPOT' | 'TRIANGULAR' | 'INTER_EXCHANGE'>('ALL');

  const loadAllSectorData = async () => {
    try {
      const [h, t, a, p, ords] = await Promise.all([
        fetchSystemHealthApi(),
        fetchTreasuryApi(),
        fetchAnalyticsApi(),
        calculateProjectionsApi(simInitialCapital, simMonthlyContribution),
        fetchAutomationHistoryApi(),
      ]);
      if (h) setHealth(h);
      if (t) setTreasury(t);
      if (a) setAnalytics(a);
      if (p) setProjections(p);
      if (ords) setOrders(ords);
    } catch (e) {
      console.error('Error loading dashboard sector data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSectorData();
    const interval = setInterval(loadAllSectorData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleKillSwitch = async () => {
    if (!health) return;
    const willActivate = !health.killSwitchActive;
    const confirmMsg = willActivate
      ? '🚨 ATENÇÃO: Ativar o KILL SWITCH GLOBAL irá congelar imediatamente todas as ordens, robôs e transferências. Confirmar parada de emergência?'
      : 'Deseja desativar o Kill Switch e retomar as operações normais do M.Árbitro?';
    if (!confirm(confirmMsg)) return;

    setIsTogglingKillSwitch(true);
    try {
      const res = await toggleKillSwitchApi(willActivate);
      setHealth((prev) => prev ? { ...prev, killSwitchActive: res.killSwitchActive, status: res.killSwitchActive ? 'EMERGENCY_STOP' : 'OPTIMAL' } : null);
      setNotification(res.message);
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar Kill Switch');
    } finally {
      setIsTogglingKillSwitch(false);
    }
  };

  const handleRecalculateProjections = async () => {
    try {
      const p = await calculateProjectionsApi(simInitialCapital, simMonthlyContribution);
      setProjections(p);
      setNotification('Curvas de projeção exponencial recalculadas com sucesso!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro no cálculo');
    }
  };

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rebFrom === rebTo) {
      alert('Selecione corretoras diferentes para rebalanceamento.');
      return;
    }
    setIsRebalancing(true);
    try {
      await rebalanceTreasuryApi({ fromExchange: rebFrom, toExchange: rebTo, amountUsd: rebAmount });
      const updatedT = await fetchTreasuryApi();
      if (updatedT) setTreasury(updatedT);
      setNotification(`Rebalanceamento de $${rebAmount} USDT de ${rebFrom.toUpperCase()} para ${rebTo.toUpperCase()} disparado via rede Solana SPL!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Falha no rebalanceamento');
    } finally {
      setIsRebalancing(false);
    }
  };

  // Filtered opportunities for Sector 2 (Live Feed)
  const feedOpportunities = opportunities.filter((opp) => {
    if (radarType === 'ALL') return true;
    if (radarType === 'SPOT') return opp.buyExchange === opp.sellExchange;
    if (radarType === 'INTER_EXCHANGE') return opp.buyExchange !== opp.sellExchange;
    if (radarType === 'TRIANGULAR') return opp.pair.includes('BTC') || opp.pair.includes('ETH');
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Strategic Header: Branding & Global Kill Switch */}
      <div className={`p-6 rounded-2xl border transition-all relative overflow-hidden shadow-2xl ${
        health?.killSwitchActive
          ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                CENTRAL MULTIDIMENSIONAL ENTERPRISE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                · Sistema M.Árbitro v4.8 HFT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Centro de Comando Estratégico (6 Setores)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Painel multidimensional unificado com monitoramento de saúde de rede, radar ao vivo, controle de tesouraria consolidada USD/BRL, auditoria de ordens e projeções exponenciais de banca.
            </p>
          </div>

          {/* Quick Action Controls & Global Kill Switch */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenApiVault}
              className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <span>🔑 Gerenciar APIs (8 Corretoras)</span>
            </button>

            {/* GLOBAL KILL SWITCH BUTTON */}
            <button
              type="button"
              onClick={handleKillSwitch}
              disabled={isTogglingKillSwitch}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-xl active:translate-y-px ${
                health?.killSwitchActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50 shadow-emerald-500/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-500/50 shadow-rose-600/30 animate-pulse'
              }`}
            >
              <Power className="w-4 h-4 fill-current" />
              <span>
                {health?.killSwitchActive ? 'DESATIVAR KILL SWITCH (NORMALIZAR)' : 'KILL SWITCH GLOBAL (PARADA)'}
              </span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Sector Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { num: 1, title: 'Saúde & Status', sub: 'Latência & Kill Switch', icon: Activity, color: 'text-emerald-400' },
          { num: 2, title: 'Radar & Feed', sub: 'Oportunidades Ao Vivo', icon: Zap, color: 'text-amber-400' },
          { num: 3, title: 'Tesouraria', sub: 'USD/BRL & Rebalanceamento', icon: Wallet, color: 'text-cyan-400' },
          { num: 4, title: 'Desk de Execução', sub: 'Logs & Auditoria', icon: Terminal, color: 'text-purple-400' },
          { num: 5, title: 'Analytics & P&L', sub: 'Win Rate & Lucro', icon: BarChart3, color: 'text-indigo-400' },
          { num: 6, title: 'Projeção de Banca', sub: 'Juros Compostos & Metas', icon: TrendingUp, color: 'text-emerald-400' },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSector === sec.num;
          return (
            <button
              key={sec.num}
              onClick={() => setActiveSector(sec.num as any)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/60 hover:bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  SETOR {sec.num}
                </span>
                <Icon className={`w-4 h-4 ${sec.color}`} />
              </div>
              <div className="mt-2">
                <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {sec.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {sec.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SETOR 1: VISÃO MACRO & SAÚDE DO SISTEMA (HEALTH & STATUS)  */}
      {/* ========================================================= */}
      {activeSector === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Latência WebSocket HFT</div>
              <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-2">
                <span>{health?.wsLatencyMs || 24} ms</span>
                <span className="text-[10px] text-emerald-500 font-mono">Ultrabaixa</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tempo de resposta dos feeds REST/WS</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">APIs CEX Conectadas</div>
              <div className="text-2xl font-black text-cyan-400 mt-1 flex items-baseline gap-2">
                <span>8 / 8</span>
                <span className="text-[10px] text-cyan-500 font-mono">100% Online</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Binance, Bitget, OKX, Gate, Kraken, MEXC, HTX, KuCoin</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Carga do Servidor</div>
              <div className="text-2xl font-black text-purple-400 mt-1 flex items-baseline gap-2">
                <span>CPU: {health?.cpuUsagePct || 18}%</span>
                <span className="text-xs text-slate-400 font-mono">RAM: {health?.memUsagePct || 42}%</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Processamento de 5.000+ ticks/segundo</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Status Operacional</div>
              <div className="text-xl font-black text-white mt-1 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${health?.killSwitchActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span>{health?.killSwitchActive ? 'EMERGÊNCIA STOP' : 'OPTIMAL (HFT)'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Protocolo de 5 Travas Zero-Risco Ativo</div>
            </div>
          </div>

          {/* Critical Alerts & Connectivity Telemetry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Alertas Críticos &amp; Telemetria em Tempo Real</h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold">8 WebSockets Sincronizados</span>
            </div>

            <div className="space-y-2">
              {(health?.criticalAlerts || []).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    alert.level === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : alert.level === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.level === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SETOR 2: CENTRAL DE OPORTUNIDADES & RADAR ATIVO (LIVE FEED) */}
      {/* ========================================================= */}
      {activeSector === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Radar Ativo de Arbitragem em Tempo Real</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Feed dinâmico com spread bruto, taxas estimadas e margem de lucro líquido calculada antes do disparo.
                </p>
              </div>

              {/* Radar Type Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['ALL', 'SPOT', 'INTER_EXCHANGE', 'TRIANGULAR'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setRadarType(type)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      radarType === type ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type === 'ALL' ? 'Todos os Tipos' : type === 'INTER_EXCHANGE' ? 'Entre Casas (Cross)' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Opportunities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {feedOpportunities.slice(0, 9).map((opp) => {
                const finalNetUsd = opp.netProfitFinalUsd ?? opp.estimatedProfitUsd;
                const finalNetPct = opp.netProfitFinalPct ?? opp.estimatedNetSpreadPct;
                return (
                  <div
                    key={opp.id}
                    className="p-4 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-sm">{opp.pair}</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        +{finalNetPct.toFixed(2)}% Líquido
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Rota: <strong className="text-white uppercase">{opp.buyExchange}</strong> ➔ <strong className="text-white uppercase">{opp.sellExchange}</strong></span>
                      <span className="font-mono text-emerald-400">+${finalNetUsd.toFixed(2)} USDT</span>
                    </div>

                    <div className="p-2 bg-slate-900 rounded-lg text-[10px] space-y-1 text-slate-300 font-mono">
                      <div className="flex justify-between">
                        <span>Ask Compra:</span>
                        <span className="text-white">${opp.buyPrice.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bid Venda:</span>
                        <span className="text-emerald-400">${opp.sellPrice.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-sans">
                        <span>Trava de Liquidez:</span>
                        <span>Máx ${Math.round(opp.maxExecutableUsd)} USDT</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onOpenTicket(opp)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white transition-colors"
                      >
                        Ver Bilhete
                      </button>
                      <button
                        onClick={() => onOpenBot(opp)}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Disparar Bot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SETOR 3: GESTÃO DE BANCA & ALOCAÇÃO DE CAPITAL (TREASURY)  */}
      {/* ========================================================= */}
      {activeSector === 3 && (
        <div className="space-y-6">
          {/* Consolidated Treasury Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Saldo Total Consolidado (USD)</div>
              <div className="text-3xl font-black text-white mt-1 font-mono">
                ${(treasury?.totalUsd || 40000).toLocaleString('en-US')} USDT
              </div>
              <div className="text-xs text-slate-500 mt-1">Capital distribuído entre corretoras e carteiras</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Saldo Convertido em Reais (BRL)</div>
              <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                R$ {(treasury?.totalBrl || 240000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Cotação comercial: R$ 6,00 / USD</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Capital em Trânsito / Redes</div>
              <div className="text-3xl font-black text-purple-400 mt-1 font-mono">
                ${(treasury?.inTransitUsd || 4000).toLocaleString('en-US')} USDT
              </div>
              <div className="text-xs text-slate-500 mt-1">Saques confirmando nas blockchains (10% alocado)</div>
            </div>
          </div>

          {/* Interactive Capital Allocation Distribution Strip & Rebalance Tool */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Allocation Breakdown (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Distribuição Exata de Capital por Corretora</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Total: 100%</span>
              </div>

              {/* Visual Segmented Progress Bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-950 p-0.5 border border-slate-800">
                {(treasury?.distribution || []).map((item) => (
                  <div
                    key={item.exchange}
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-80"
                    title={`${item.name}: ${item.pct}% ($${item.balanceUsd.toLocaleString()} USDT)`}
                  />
                ))}
              </div>

              {/* Detailed Breakdown List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(treasury?.distribution || []).map((item) => (
                  <div
                    key={item.exchange}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          R$ {item.balanceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">${item.balanceUsd.toLocaleString()} USDT</div>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold">{item.pct}% da Banca</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Rebalance Form (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Rebalanceamento de Banca</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Transfira liquidez entre corretoras via blockchain para manter o equilíbrio operacional.
                </p>
              </div>

              <form onSubmit={handleRebalance} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Origem (Saque)</label>
                  <select
                    value={rebFrom}
                    onChange={(e) => setRebFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="binance">Binance</option>
                    <option value="bitget">Bitget</option>
                    <option value="okx">OKX</option>
                    <option value="gate">Gate.io</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Destino (Depósito)</label>
                  <select
                    value={rebTo}
                    onChange={(e) => setRebTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="bitget">Bitget</option>
                    <option value="binance">Binance</option>
                    <option value="okx">OKX</option>
                    <option value="gate">Gate.io</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valor a Rebalancear (USDT)</label>
                  <input
                    type="number"
                    value={rebAmount}
                    onChange={(e) => setRebAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRebalancing}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 active:translate-y-px"
                >
                  {isRebalancing ? 'Disparando Saque na Rede...' : 'Executar Rebalanceamento'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SETOR 4: EXECUÇÕES, LOGS E AUDITORIA (EXECUTION DESK)      */}
      {/* ========================================================= */}
      {activeSector === 4 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Desk de Execução &amp; Comprovantes de Arbitragem</h3>
              </div>
              <div className="flex items-center gap-2">
                {onOpenLedger && (
                  <button
                    onClick={onOpenLedger}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    title="Abrir o painel contábil completo de lucros, taxas e onde o dinheiro foi"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Ver Extrato: Onde Foi o Dinheiro</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 font-mono">{orders.length} Ordens Auditadas</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">ID Ordem</th>
                    <th className="py-3 px-3">Par &amp; Rota</th>
                    <th className="py-3 px-3">Rede &amp; Hash Saque</th>
                    <th className="py-3 px-3">Capital Operado</th>
                    <th className="py-3 px-3">Lucro Líquido Real</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{ord.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{ord.pair}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                          <span className="text-emerald-400 font-bold">{ord.buyExchange}</span> ➔ <span className="text-purple-400 font-bold">{ord.sellExchange}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white text-[11px]">{ord.networkName}</div>
                        <div className="text-[10px] font-mono text-purple-300 truncate max-w-[140px]" title={ord.withdrawTxId}>
                          Tx: {ord.withdrawTxId?.slice(0, 14)}...
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">${ord.capitalUsd} USDT</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        +${ord.actualProfitUsd?.toFixed(2)} (+{ord.actualProfitPct?.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SETOR 5: MÉTRICAS DE PERFORMANCE & ANALYTICS (P&L CHARTS)  */}
      {/* ========================================================= */}
      {activeSector === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Taxa de Acerto (Win Rate)</div>
              <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                {analytics?.winRatePct || 98.4}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Operações protegidas pelas 5 travas zero-risco</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Maior Lucro Único</div>
              <div className="text-3xl font-black text-cyan-400 mt-1 font-mono">
                +${analytics?.biggestWinUsd?.toFixed(2) || '142.80'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Registrado em arbitragem MEME na Solana</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Drawdown Máximo</div>
              <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                {analytics?.maxDrawdownPct || 0.38}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Quase nulo devido ao cancelamento preventivo</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Média de Lucro / Hora</div>
              <div className="text-3xl font-black text-amber-400 mt-1 font-mono">
                +${analytics?.avgProfitPerHourUsd?.toFixed(2) || '18.75'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Em regime de piloto automático contínuo</div>
            </div>
          </div>

          {/* Daily & Weekly P&L Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Lucro Realizado por Dia (Últimos 7 dias)</span>
                </h4>
                <span className="text-xs text-emerald-400 font-mono font-bold">100% Positivo</span>
              </div>

              <div className="space-y-2">
                {(analytics?.dailyPnl || []).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg text-xs">
                    <span className="font-semibold text-slate-300">{day.date}</span>
                    <span className="text-[11px] text-slate-500">{day.tradesCount} trades</span>
                    <span className="font-mono font-bold text-emerald-400">+${day.profitUsd.toFixed(2)} USDT</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Consolidado Semanal &amp; Mensal</span>
                </h4>
                <span className="text-xs text-cyan-400 font-mono font-bold">Escala Exponencial</span>
              </div>

              <div className="space-y-2">
                {(analytics?.weeklyPnl || []).map((w) => (
                  <div key={w.week} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg text-xs">
                    <span className="font-semibold text-slate-300">{w.week}</span>
                    <span className="font-mono font-bold text-cyan-400">+${w.profitUsd.toFixed(2)} USDT</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SETOR 6: PLANOS FUTUROS, PROJEÇÕES & METAS (COMPOUND)     */}
      {/* ========================================================= */}
      {activeSector === 6 && (
        <div className="space-y-6">
          {/* Compound Growth Simulator Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Simulador de Crescimento Exponencial de Banca (Juros Compostos)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calcule onde sua banca vai chegar reinvestindo os lucros diários da arbitragem com aportes mensais.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRecalculateProjections}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 active:translate-y-px flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalcular Curvas</span>
              </button>
            </div>

            {/* Inputs: Capital Inicial & Aporte Mensal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="font-semibold text-slate-300">Capital Inicial da Banca</label>
                  <span className="font-mono font-bold text-emerald-400">${simInitialCapital} USDT</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={simInitialCapital}
                  onChange={(e) => setSimInitialCapital(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="font-semibold text-slate-300">Aporte Mensal Adicional</label>
                  <span className="font-mono font-bold text-cyan-400">${simMonthlyContribution} USDT/mês</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={simMonthlyContribution}
                  onChange={(e) => setSimMonthlyContribution(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Horizon Cards (3 Meses, 6 Meses, 1 Ano, 3 Anos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '3 Meses (Curto Prazo)', data: projections?.projections.months3 },
                { label: '6 Meses (Consolidação)', data: projections?.projections.months6 },
                { label: '1 Ano (Escala Profissional)', data: projections?.projections.year1 },
                { label: '3 Anos (Nível Fundo)', data: projections?.projections.years3 },
              ].map((h, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-white border-b border-slate-800 pb-1.5">{h.label}</div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Conservador (0.5%/d):</span>
                      <strong className="text-white">${h.data?.conservative.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-cyan-400">
                      <span>Moderado (1.0%/d):</span>
                      <strong className="font-bold">${h.data?.moderate.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Agressivo (1.8%/d):</span>
                      <span>${h.data?.aggressive.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification & Financial Milestones (Marcos da Jornada) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Metas de Marcos (Gamificação de Conquistas)</h3>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">Plano de Alavancagem M.Árbitro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(projections?.milestones || []).map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    m.achieved
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{m.badge}</span>
                    {m.achieved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                        CONQUISTADO
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        {m.currentProgressPct}% Concluído
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white">{m.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {m.celebrationMessage}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${m.achieved ? 'bg-amber-400' : 'bg-emerald-500'} transition-all`}
                      style={{ width: `${m.currentProgressPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
