/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MultidimensionalDashboardView } from './components/MultidimensionalDashboardView';
import { KpiMetricsBar } from './components/KpiMetricsBar';
import { FilterControls } from './components/FilterControls';
import { OpportunityTable } from './components/OpportunityTable';
import { OpportunityTicketCard } from './components/OpportunityTicketCard';
import { ArbitrageTicketModal } from './components/ArbitrageTicketModal';
import { ExecutionWizardModal } from './components/ExecutionWizardModal';
import { ByExchangePairsView } from './components/ByExchangePairsView';
import { OrderBookModal } from './components/OrderBookModal';
import { AIAgentsBuildingView } from './components/AIAgentsBuildingView';
import { NetworkDirectoryView } from './components/NetworkDirectoryView';
import { ArbitrageGuideView } from './components/ArbitrageGuideView';
import { InteractiveSimulatorView } from './components/InteractiveSimulatorView';
import { AdminClientManagementView } from './components/AdminClientManagementView';
import { AutomatedTradingBotView } from './components/AutomatedTradingBotView';
import { ProfitAndFeeLedgerView } from './components/ProfitAndFeeLedgerView';
import { ExchangeApiKeysModal } from './components/ExchangeApiKeysModal';
import { AuthModal } from './components/AuthModal';
import { fetchArbitrageOpportunities, fetchSystemHealthApi } from './services/api';
import { ArbitrageOpportunity, ScannerFilterState } from './types/arbitrage';
import { UserAccount } from './types/auth';
import { 
  Layers, Network, BookOpen, ShieldAlert, AlertCircle, RefreshCw, 
  BrainCircuit, Ticket, Building2, Zap, Bot, Crown, ArrowRight, Sparkles,
  Key, Compass, ShieldCheck 
} from 'lucide-react';

const DEFAULT_MASTER_ADMIN: UserAccount = {
  id: 'admin_marcos_master',
  name: 'Marcos Europa (CEO & Master Admin)',
  email: 'marcostradereuropa@gmail.com',
  role: 'ADMIN',
  plan: 'LIFETIME_VIP',
  status: 'ACTIVE',
  expiresAt: null,
  maxCapitalUsd: 0,
  notes: 'CEO, Arquiteto Master e Proprietário do Sistema M.Árbitro',
  phone: '+351 912 345 678',
  createdAt: Date.now() - 60 * 86400000,
  contractStartDate: Date.now() - 60 * 86400000,
  monthlyFee: 0,
  paymentStatus: 'PAID',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'agents' | 'automation' | 'admin' | 'networks' | 'calculator' | 'guide' | 'ledger'>('dashboard');
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [exchangesActive, setExchangesActive] = useState<string[]>([
    'binance', 'coinbase', 'kraken', 'bybit', 'bitget', 'kucoin', 'okx', 'gate', 'bitfinex', 'mexc', 'htx'
  ]);
  const [totalPairsScanned, setTotalPairsScanned] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('arbitrx_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MASTER_ADMIN;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('arbitrx_token');
    } catch (e) {}
    return 'usr_tok_admin_marcos_master';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isApiVaultOpen, setIsApiVaultOpen] = useState<boolean>(false);

  // Modals state
  const [ticketOpportunity, setTicketOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [executionOpportunity, setExecutionOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [orderBookOpportunity, setOrderBookOpportunity] = useState<ArbitrageOpportunity | null>(null);

  // Filter State
  const [filter, setFilter] = useState<ScannerFilterState>({
    searchQuery: '',
    minNetSpreadPct: 0.0,
    minGrossSpreadPct: -0.5,
    capitalUsd: 1000,
    takerFeePct: 0.1,
    onlyActiveNetworks: false,
    onlyProfitable: false,
    only100PercentApproved: false,
    selectedExchanges: [
      'binance', 'coinbase', 'kraken', 'bybit', 'bitget', 'kucoin', 'okx', 'gate', 'bitfinex', 'mexc', 'htx'
    ],
    selectedNetworkIds: [],
    viewMode: 'tickets',
    selectedHousePair: undefined,
    selectedCategory: 'ALL',
    onlyHighProfit: false,
  });

  // Load live scanner data
  const loadOpportunities = useCallback(async (isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [data, healthData] = await Promise.all([
        fetchArbitrageOpportunities(filter.capitalUsd),
        fetchSystemHealthApi(),
      ]);
      setOpportunities(data.opportunities || []);
      if (data.exchangesActive && data.exchangesActive.length > 0) {
        setExchangesActive(data.exchangesActive);
      }
      setTotalPairsScanned(data.totalPairsScanned || 0);
      setLastUpdated(data.lastUpdated || Date.now());
      if (healthData) {
        setIsKillSwitchActive(healthData.killSwitchActive);
      }
    } catch (err: any) {
      console.error('Failed to load opportunities:', err);
      setErrorMessage('Não foi possível conectar com as exchanges no momento. Tentando novamente...');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter.capitalUsd]);

  // Initial load
  useEffect(() => {
    loadOpportunities(true);
  }, [loadOpportunities]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadOpportunities(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadOpportunities]);

  // Handle Login / Logout
  const handleLoginSuccess = (user: UserAccount, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('arbitrx_user', JSON.stringify(user));
      localStorage.setItem('arbitrx_token', token);
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('arbitrx_user');
      localStorage.removeItem('arbitrx_token');
    } catch (e) {}
  };

  // Calculate count of 100% approved tickets right now
  const approved100Count = useMemo(() => {
    return opportunities.filter((opp) => {
      const finalNetUsd = opp.netProfitFinalUsd ?? opp.estimatedProfitUsd;
      return (
        opp.sacStatus === 'DISPONÍVEL' &&
        opp.regStatus === 'DISPONÍVEL' &&
        opp.networkStatus === 'ACTIVE' &&
        finalNetUsd > 0
      );
    }).length;
  }, [opportunities]);

  // Client-side filtering
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.trim().toUpperCase();
        if (!opp.symbol.includes(query) && !opp.pair.includes(query)) {
          return false;
        }
      }

      if (filter.selectedCategory && filter.selectedCategory !== 'ALL') {
        if (opp.category !== filter.selectedCategory) return false;
      }

      const finalNetPct = opp.netProfitFinalPct ?? opp.estimatedNetSpreadPct;
      if (filter.onlyHighProfit) {
        if (finalNetPct < 2.5) return false;
      }

      const finalNetUsd = opp.netProfitFinalUsd ?? opp.estimatedProfitUsd;
      const is100Approved = opp.sacStatus === 'DISPONÍVEL' &&
                            opp.regStatus === 'DISPONÍVEL' &&
                            opp.networkStatus === 'ACTIVE' &&
                            opp.isFeasible &&
                            finalNetUsd > 0;

      if (filter.only100PercentApproved) {
        if (!is100Approved) return false;
      }

      const buyExOk = filter.selectedExchanges.includes(opp.buyExchange.toLowerCase());
      const sellExOk = filter.selectedExchanges.includes(opp.sellExchange.toLowerCase());
      if (!buyExOk || !sellExOk) return false;

      if (filter.selectedHousePair) {
        const pairKey = `${opp.buyExchange.toLowerCase()}-${opp.sellExchange.toLowerCase()}`;
        if (pairKey !== filter.selectedHousePair) return false;
      }

      if (filter.onlyActiveNetworks) {
        if (opp.networkStatus !== 'ACTIVE') return false;
      }

      if (filter.onlyProfitable) {
        if (!opp.isFeasible || finalNetUsd <= 0) return false;
      }

      if (filter.minNetSpreadPct >= 0) {
        if (finalNetPct < filter.minNetSpreadPct) return false;
      }

      return true;
    });
  }, [opportunities, filter]);

  const handleOpenBotFromTicket = (opp?: ArbitrageOpportunity) => {
    if (opp) setExecutionOpportunity(opp);
    setActiveTab('automation');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadOpportunities(false)}
        isRefreshing={isRefreshing}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenApiVault={() => setIsApiVaultOpen(true)}
        killSwitchActive={isKillSwitchActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadOpportunities(false)}
              className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Tab 0: NOVO DASHBOARD MULTIDIMENSIONAL (6 SETORES) */}
        {activeTab === 'dashboard' && (
          <MultidimensionalDashboardView
            opportunities={opportunities}
            onOpenTicket={(o) => setTicketOpportunity(o)}
            onOpenOrderBook={(o) => setOrderBookOpportunity(o)}
            onOpenBot={(o) => handleOpenBotFromTicket(o)}
            onOpenApiVault={() => setIsApiVaultOpen(true)}
            onOpenLedger={() => setActiveTab('ledger')}
          />
        )}

        {/* Tab 1: Live Scanner & Tickets View */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* HERO PROMOTIONAL BANNER: ONDE INSERIR AS APIS DAS CORRETORAS */}
            <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-emerald-950/50 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                  <Key className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AUTOMAÇÃO 100% DISPONÍVEL VIA API
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                    Onde conectar as APIs das corretoras para operar no piloto automático?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Clique no botão ao lado para abrir o <strong>Cofre de APIs</strong> e inserir suas chaves da Binance, Bitget, OKX, Gate, Kraken, MEXC ou KuCoin. O robô faz a compra na Casa 1, transfere pela blockchain e vende na Casa 2 sozinho com as taxas já descontadas!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsApiVaultOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 active:translate-y-px"
                >
                  <Key className="w-4 h-4 text-purple-200" />
                  <span>Inserir APIs das Corretoras</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('automation')}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Abrir Robô</span>
                </button>
              </div>
            </div>

            {/* Headline */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3 text-purple-400" />
                    EDIFÍCIO MULTIAGENTE M.ÁRBITRO
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    · Altcoins, Memecoins &amp; Trava de Liquidez Integrada
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Scanner de Arbitragem &amp; Bilhetes de Operação
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Cada oportunidade possui um <strong>Bilhete Oficial</strong> com a porcentagem líquida já calculada, a liquidez de compra e a <strong>trava de venda imediata</strong> (indicando o teto máximo que você pode comprar para conseguir vender sem risco).
                </p>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Dados Oficiais Spot</span>
                <span aria-hidden="true">·</span>
                <span>8 Corretoras Conectadas</span>
              </div>
            </div>

            {/* KPI Metrics Summary Strip */}
            <KpiMetricsBar
              opportunities={opportunities}
              totalPairsScanned={totalPairsScanned}
              exchangesActive={exchangesActive}
              lastUpdated={lastUpdated}
              capitalUsd={filter.capitalUsd}
            />

            {/* Filters & Control Bar */}
            <FilterControls
              filter={filter}
              setFilter={setFilter}
              availableExchanges={exchangesActive}
              approved100Count={approved100Count}
            />

            {/* View Mode Switching */}
            {filter.viewMode === 'tickets' ? (
              <div>
                {isLoading && opportunities.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-base font-semibold text-white">Auditando oportunidades e emitindo bilhetes...</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sentinela de Mercado e Engenheiro de Liquidez processando livros de oferta de 8 corretoras.
                    </p>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
                    <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-white">Nenhum bilhete com os filtros selecionados</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {filter.only100PercentApproved
                        ? 'Nenhum bilhete 100% aprovado atende a todos os critérios restritos no momento. Desmarque o filtro ou diminua o spread.'
                        : 'Ajuste o filtro de categoria ou diminua o spread mínimo para liberar novos bilhetes.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOpportunities.map((opp) => (
                      <OpportunityTicketCard
                        key={opp.id}
                        opportunity={opp}
                        onOpenTicket={(o) => setTicketOpportunity(o)}
                        onOpenOrderBook={(o) => setOrderBookOpportunity(o)}
                        onOpenExecutionWizard={(o) => handleOpenBotFromTicket(o)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : filter.viewMode === 'by_exchange_pairs' ? (
              <ByExchangePairsView
                opportunities={filteredOpportunities}
                onOpenTicket={(o) => setTicketOpportunity(o)}
                onOpenOrderBook={(o) => setOrderBookOpportunity(o)}
                onOpenExecutionWizard={(o) => handleOpenBotFromTicket(o)}
                selectedHousePair={filter.selectedHousePair}
                onSelectHousePair={(pair) => setFilter((prev) => ({ ...prev, selectedHousePair: pair }))}
              />
            ) : (
              <OpportunityTable
                opportunities={filteredOpportunities}
                capitalUsd={filter.capitalUsd}
                onSelectOpportunity={(opp) => setOrderBookOpportunity(opp)}
                onOpenTicket={(opp) => setTicketOpportunity(opp)}
                onOpenExecutionWizard={(opp) => handleOpenBotFromTicket(opp)}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* Tab 2: A Central "O Edifício" (5 Andares e 5 Travas Zero-Risco) */}
        {activeTab === 'agents' && (
          <AIAgentsBuildingView
            onNavigateToTickets={() => setActiveTab('scanner')}
            onOpenBot={() => setActiveTab('automation')}
          />
        )}

        {/* Tab 3: Bot de Automação via API das Corretoras */}
        {activeTab === 'automation' && (
          <AutomatedTradingBotView
            initialOpportunity={executionOpportunity}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {/* Tab 4: Painel do CEO - Governança SaaS & Gestão de Clientes */}
        {activeTab === 'admin' && (
          <AdminClientManagementView currentUser={currentUser} />
        )}

        {/* Tab 5: Networks & Fees Directory */}
        {activeTab === 'networks' && <NetworkDirectoryView />}

        {/* Tab 6: Interactive Order Book Simulator */}
        {activeTab === 'calculator' && <InteractiveSimulatorView />}

        {/* Tab 7: Arbitrage Execution Guide & Rules */}
        {activeTab === 'guide' && <ArbitrageGuideView />}

        {/* Tab 8: Painel Contábil: Extrato de Lucros, Gastos de Taxas & Onde o Dinheiro Foi */}
        {activeTab === 'ledger' && <ProfitAndFeeLedgerView />}
      </main>

      {/* Floating Quick Navigation Buttons */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsApiVaultOpen(true)}
          className="px-3.5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-400/50 rounded-full shadow-2xl shadow-purple-500/30 text-xs font-bold text-white flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          title="Abrir Cofre de APIs das Corretoras"
        >
          <Key className="w-4 h-4 text-purple-200" />
          <span className="hidden sm:inline">Chaves de API</span>
        </button>

        {activeTab !== 'agents' && (
          <button
            onClick={() => setActiveTab('agents')}
            className="px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-900 border border-purple-500/50 hover:border-purple-400 rounded-full shadow-2xl shadow-purple-500/20 text-xs font-bold text-white flex items-center gap-2.5 transition-all group hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span>O Edifício (5 Andares)</span>
            <ArrowRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* EXCHANGE API KEYS MODAL (Accessible from anywhere) */}
      <ExchangeApiKeysModal
        isOpen={isApiVaultOpen}
        onClose={() => setIsApiVaultOpen(false)}
        onOpenBot={() => setActiveTab('automation')}
      />

      {/* Official Arbitrage Ticket Modal */}
      <ArbitrageTicketModal
        opportunity={ticketOpportunity}
        onClose={() => setTicketOpportunity(null)}
        capitalUsd={filter.capitalUsd}
        onOpenExecution={(o) => handleOpenBotFromTicket(o)}
      />

      {/* Rapid Execution Wizard Modal */}
      <ExecutionWizardModal
        opportunity={executionOpportunity}
        onClose={() => setExecutionOpportunity(null)}
        capitalUsd={filter.capitalUsd}
      />

      {/* Live Order Book Depth Modal */}
      <OrderBookModal
        opportunity={orderBookOpportunity}
        onClose={() => setOrderBookOpportunity(null)}
        defaultCapital={filter.capitalUsd}
      />

      {/* Auth Modal for Admin & Clients */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-300">M.Árbitro Enterprise HFT</span>
            <span>·</span>
            <span>Centro de Comando Multidimensional (6 Setores) &amp; Protocolo 5 Travas Zero-Risco</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right font-mono text-[11px]">
            CEO: marcostradereuropa@gmail.com · Binance · Bitget · OKX · Gate · Kraken · MEXC · HTX · KuCoin
          </div>
        </div>
      </footer>
    </div>
  );
}
