import { ArbitrageOpportunity, OrderBookResponse, TradeSimulationResult, AssetNetworks } from '../types/arbitrage';
import { UserAccount, CreateClientPayload } from '../types/auth';
import { ExchangeApiCredential, AutoExecutionOrder, BotConfig } from '../types/automation';
import { ProfitAndFeeSummary } from '../types/enterprise';

export async function fetchArbitrageOpportunities(capitalUsd: number = 1000): Promise<{
  opportunities: ArbitrageOpportunity[];
  exchangesActive: string[];
  totalPairsScanned: number;
  lastUpdated: number;
}> {
  try {
    const res = await fetch(`/api/scanner?capital=${encodeURIComponent(capitalUsd)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Scanner API returned status ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('Backend proxy fetch failed, attempting direct public API fallback:', err.message);
    return await fetchClientDirectFallback(capitalUsd);
  }
}

export async function fetchOrderBook(exchange: string, symbol: string): Promise<OrderBookResponse | null> {
  try {
    const res = await fetch(`/api/orderbook?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
    if (!res.ok) throw new Error(`OrderBook API error: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn(`Orderbook fetch failed for ${exchange} ${symbol}:`, err.message);
    // Direct client fallback for Binance order book
    if (exchange === 'binance') {
      try {
        const binanceRes = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=20`);
        if (binanceRes.ok) {
          const data = await binanceRes.json();
          return {
            exchange: 'binance',
            symbol,
            pair: `${symbol}/USDT`,
            bids: (data.bids || []).map((b: [string, string]) => ({
              price: parseFloat(b[0]),
              qty: parseFloat(b[1]),
              totalUsd: parseFloat(b[0]) * parseFloat(b[1]),
            })),
            asks: (data.asks || []).map((a: [string, string]) => ({
              price: parseFloat(a[0]),
              qty: parseFloat(a[1]),
              totalUsd: parseFloat(a[0]) * parseFloat(a[1]),
            })),
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

export async function simulateArbitrageTrade(params: {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  capitalUsd: number;
  networkId?: string;
  buyFeePct?: number;
  sellFeePct?: number;
}): Promise<TradeSimulationResult | null> {
  try {
    const res = await fetch('/api/simulate-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Simulation API error: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error('Simulation failed:', err.message);
    return null;
  }
}

export async function fetchAllNetworks(): Promise<Record<string, AssetNetworks>> {
  try {
    const res = await fetch('/api/networks');
    if (!res.ok) throw new Error(`Networks API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {};
  }
}

export async function fetchAIAgents(): Promise<any[]> {
  try {
    const res = await fetch('/api/agents');
    if (!res.ok) throw new Error('Agents API error');
    const data = await res.json();
    return data.agents || [];
  } catch (e) {
    return [];
  }
}

export async function analyzeOpportunityWithAI(opportunity: ArbitrageOpportunity): Promise<{ analysis: string; isAiPowered: boolean; model: string }> {
  try {
    const res = await fetch('/api/ai-analyze-opportunity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity }),
    });
    if (!res.ok) throw new Error('AI analysis error');
    return await res.json();
  } catch (e: any) {
    return {
      analysis: `Aviso dos Agentes: Compre no máximo $${Math.round(opportunity.maxExecutableUsd)} devido à trava de liquidez de venda na ${opportunity.sellExchange.toUpperCase()}.`,
      isAiPowered: false,
      model: 'fallback',
    };
  }
}

export async function generateOpportunityTicket(opportunity: ArbitrageOpportunity): Promise<any> {
  try {
    const res = await fetch('/api/generate-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity }),
    });
    if (!res.ok) throw new Error('Ticket generation error');
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function verifyLiveOrderBookTicket(params: {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  capitalUsd?: number;
}): Promise<any> {
  try {
    const res = await fetch('/api/verify-live-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Live verification error');
    return await res.json();
  } catch (e: any) {
    console.warn('Live verification request failed:', e.message);
    return null;
  }
}

// Client-side fallback if server is restarting
async function fetchClientDirectFallback(capitalUsd: number) {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/bookTicker');
    if (!res.ok) throw new Error('Binance direct fetch failed');
    const data = await res.json();
    const binanceTickers: any[] = [];
    for (const item of data) {
      if (item.symbol && item.symbol.endsWith('USDT')) {
        const symbol = item.symbol.replace('USDT', '');
        binanceTickers.push({
          symbol,
          pair: `${symbol}/USDT`,
          exchange: 'binance',
          bidPrice: parseFloat(item.bidPrice),
          bidQty: parseFloat(item.bidQty),
          askPrice: parseFloat(item.askPrice),
          askQty: parseFloat(item.askQty),
        });
      }
    }
    return {
      opportunities: [],
      exchangesActive: ['binance'],
      totalPairsScanned: binanceTickers.length,
      lastUpdated: Date.now(),
    };
  } catch (e) {
    return {
      opportunities: [],
      exchangesActive: [],
      totalPairsScanned: 0,
      lastUpdated: Date.now(),
    };
  }
}

// =============================================================
// AUTH & ADMIN CLIENT MANAGEMENT API CLIENT
// =============================================================

export async function loginApi(email: string, password?: string): Promise<{ success: boolean; token: string; user: UserAccount }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao autenticar.');
  }
  return data;
}

export async function fetchCurrentUserApi(token?: string): Promise<UserAccount | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/auth/me', { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (e) {
    return null;
  }
}

export async function fetchAdminUsersApi(): Promise<Array<UserAccount & { passwordPlain?: string }>> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Falha ao carregar lista de usuários');
  const data = await res.json();
  return data.users || [];
}

export async function createClientUserApi(payload: CreateClientPayload): Promise<{
  success: boolean;
  user: UserAccount;
  passwordGenerated: string;
  message: string;
}> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao criar cliente');
  return data;
}

export async function updateClientUserApi(id: string, updates: Partial<UserAccount> & { addDays?: number; password?: string }): Promise<UserAccount> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados do cliente');
  return data.user;
}

export async function deleteClientUserApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erro ao remover cliente');
  }
  return true;
}

// =============================================================
// EXCHANGE API AUTOMATION & BOT TRADING API CLIENT
// =============================================================

export async function fetchAutomationCredentialsApi(): Promise<Record<string, ExchangeApiCredential>> {
  try {
    const res = await fetch('/api/automation/credentials');
    if (!res.ok) return {};
    const data = await res.json();
    return data.credentials || {};
  } catch (e) {
    return {};
  }
}

export async function saveAutomationCredentialApi(cred: {
  exchange: string;
  apiKey: string;
  apiSecret?: string;
  passphrase?: string;
  isTestnet?: boolean;
}): Promise<ExchangeApiCredential> {
  const res = await fetch('/api/automation/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cred),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar credenciais');
  return data.credential;
}

export async function deleteAutomationCredentialApi(exchange: string): Promise<boolean> {
  const res = await fetch(`/api/automation/credentials/${encodeURIComponent(exchange)}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function fetchBotConfigApi(): Promise<BotConfig | null> {
  try {
    const res = await fetch('/api/automation/bot-config');
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch (e) {
    return null;
  }
}

export async function saveBotConfigApi(config: Partial<BotConfig>): Promise<BotConfig> {
  const res = await fetch('/api/automation/bot-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar configuração do bot');
  return data.config;
}

export async function executeTradeApi(payload: {
  opportunityId?: string;
  symbol: string;
  pair?: string;
  buyExchange: string;
  sellExchange: string;
  networkName: string;
  networkProtocol: string;
  capitalUsd: number;
  buyPrice: number;
  sellPrice: number;
  isSimulated?: boolean;
  mode?: string;
  maxExecutableUsd?: number;
}): Promise<{ 
  success: boolean; 
  order: AutoExecutionOrder; 
  message: string;
  capitalLocationAfterTrade?: string;
  currentAvailableUsdt?: number;
}> {
  const res = await fetch('/api/automation/execute-trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao executar ordem no robô.');
  return data;
}

export async function fetchAutomationHistoryApi(): Promise<AutoExecutionOrder[]> {
  try {
    const res = await fetch('/api/automation/history');
    if (!res.ok) return [];
    const data = await res.json();
    return data.orders || [];
  } catch (e) {
    return [];
  }
}

// Enterprise API Client Helpers
export async function fetchSystemHealthApi(): Promise<any> {
  try {
    const res = await fetch('/api/system/health');
    if (!res.ok) return null;
    const data = await res.json();
    return data.health;
  } catch (e) {
    return null;
  }
}

export async function toggleKillSwitchApi(active: boolean): Promise<{ success: boolean; killSwitchActive: boolean; message: string }> {
  const res = await fetch('/api/system/kill-switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao alterar Kill Switch');
  return data;
}

export async function fetchTreasuryApi(): Promise<any> {
  try {
    const res = await fetch('/api/treasury/allocation');
    if (!res.ok) return null;
    const data = await res.json();
    return data.treasury;
  } catch (e) {
    return null;
  }
}

export async function rebalanceTreasuryApi(payload: { fromExchange: string; toExchange: string; amountUsd: number }): Promise<any> {
  const res = await fetch('/api/treasury/rebalance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao rebalancear');
  return data;
}

export async function fetchAnalyticsApi(): Promise<any> {
  try {
    const res = await fetch('/api/analytics/pnl');
    if (!res.ok) return null;
    const data = await res.json();
    return data.analytics;
  } catch (e) {
    return null;
  }
}

export async function calculateProjectionsApi(initialCapitalUsd: number, monthlyContributionUsd: number): Promise<any> {
  const res = await fetch('/api/projections/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialCapitalUsd, monthlyContributionUsd }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao calcular projeções');
  return data.projections;
}

export async function fetchPricingPlansApi(): Promise<any[]> {
  try {
    const res = await fetch('/api/pricing-plans');
    if (!res.ok) return [];
    const data = await res.json();
    return data.plans || [];
  } catch (e) {
    return [];
  }
}

export async function updatePricingPlanApi(id: string, updates: any): Promise<any> {
  const res = await fetch('/api/pricing-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar plano');
  return data.plan;
}

export async function resetUserPasswordApi(userId: string, newPassword: string): Promise<any> {
  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha');
  return data;
}

export async function triggerPaymentWebhookApi(payload: any): Promise<any> {
  const res = await fetch('/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao disparar webhook');
  return data;
}

export async function fetchProfitAndFeeLedgerApi(): Promise<ProfitAndFeeSummary | null> {
  try {
    const res = await fetch('/api/ledger/profits-and-fees');
    if (!res.ok) return null;
    const data = await res.json();
    return data.ledger || null;
  } catch (e) {
    console.error('Falha ao buscar extrato de lucros e taxas:', e);
    return null;
  }
}



