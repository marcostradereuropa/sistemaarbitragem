/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemHealth {
  status: 'OPTIMAL' | 'DEGRADED' | 'EMERGENCY_STOP';
  killSwitchActive: boolean;
  wsLatencyMs: number;
  activeWebsockets: number;
  cpuUsagePct: number;
  memUsagePct: number;
  uptimeSeconds: number;
  connectedExchanges: number;
  criticalAlerts: Array<{
    id: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    timestamp: number;
  }>;
}

export interface ExchangeBalance {
  exchange: string;
  name: string;
  balanceUsd: number;
  balanceBrl: number;
  pct: number;
  color: string;
  status: 'ONLINE' | 'SYNCING' | 'OFFLINE';
}

export interface TreasuryMovement {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REBALANCE' | 'PROFIT';
  fromExchange?: string;
  toExchange?: string;
  network?: string;
  amountUsd: number;
  amountBrl: number;
  txHash?: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  timestamp: number;
}

export interface TreasuryAllocation {
  totalUsd: number;
  totalBrl: number;
  usdBrlRate: number;
  inTransitUsd: number;
  distribution: ExchangeBalance[];
  recentMovements: TreasuryMovement[];
}

export interface PerformanceAnalytics {
  winRatePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  biggestWinUsd: number;
  maxDrawdownPct: number;
  avgProfitPerHourUsd: number;
  totalProfitUsd: number;
  totalProfitBrl: number;
  dailyPnl: Array<{ date: string; profitUsd: number; profitBrl: number; tradesCount: number }>;
  weeklyPnl: Array<{ week: string; profitUsd: number; profitBrl: number }>;
  monthlyPnl: Array<{ month: string; profitUsd: number; profitBrl: number }>;
}

export interface Milestone {
  id: string;
  title: string;
  targetUsd: number;
  targetBrl: number;
  achieved: boolean;
  achievedAt?: number;
  badge: string;
  celebrationMessage: string;
  currentProgressPct: number;
}

export interface CompoundProjection {
  initialCapitalUsd: number;
  monthlyContributionUsd: number;
  dailyRateConservativePct: number; // e.g. 0.5%
  dailyRateModeratePct: number; // e.g. 1.2%
  dailyRateAggressivePct: number; // e.g. 2.0%
  projections: {
    months3: { conservative: number; moderate: number; aggressive: number };
    months6: { conservative: number; moderate: number; aggressive: number };
    year1: { conservative: number; moderate: number; aggressive: number };
    years3: { conservative: number; moderate: number; aggressive: number };
  };
  growthCurve: Array<{
    day: number;
    label: string;
    conservative: number;
    moderate: number;
    aggressive: number;
  }>;
  milestones: Milestone[];
}

export interface PricingPlanConfig {
  id: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  name: string;
  priceBrl: number;
  priceUsd: number;
  durationDays: number;
  maxCapitalUsd: number;
  activeUsersCount: number;
  features: string[];
}

export interface MoneyDestinationSlice {
  recipient: string;
  category: 'USER_PROFIT' | 'BUY_EXCHANGE_FEE' | 'SELL_EXCHANGE_FEE' | 'BLOCKCHAIN_GAS' | 'SLIPPAGE';
  categoryLabel: string;
  amountUsd: number;
  pctOfTotal: number;
  color: string;
  description: string;
}

export interface ProfitAndFeeLedgerItem {
  id: string;
  orderId: string;
  timestamp: number;
  pair: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  networkName: string;
  networkProtocol: string;
  capitalOperatedUsd: number;
  grossReturnUsd: number;
  grossProfitUsd: number;
  
  // Detalhamento das 4 faixas de taxas:
  fees: {
    buyFeeUsd: number;
    buyExchangeName: string;
    networkGasFeeUsd: number;
    networkName: string;
    sellFeeUsd: number;
    sellExchangeName: string;
    slippageUsd: number;
    totalFeesUsd: number;
    totalFeesPct: number;
  };
  
  // Lucro final retido pelo usuário
  netProfitUsd: number;
  netProfitPct: number;
  
  // Onde o dinheiro foi:
  whereTheMoneyWent: MoneyDestinationSlice[];
  
  txHashes?: {
    buyTx?: string;
    withdrawTx?: string;
    sellTx?: string;
  };
  status: 'COMPLETED' | 'RECONCILED';
}

export interface ProfitAndFeeSummary {
  totalGrossProfitUsd: number;
  totalNetProfitUsd: number;
  totalFeesPaidUsd: number;
  totalVolumeOperatedUsd: number;
  
  // Para onde o dinheiro foi acumulado:
  totalRetainedInPocketUsd: number;
  totalToExchangesUsd: number;
  totalToBlockchainGasUsd: number;
  totalToSlippageUsd: number;
  
  // Percentuais de destino:
  pctToPocket: number;
  pctToExchanges: number;
  pctToBlockchainGas: number;
  pctToSlippage: number;
  
  // Distribuição por Corretora:
  byExchange: Array<{
    exchange: string;
    name: string;
    feesPaidUsd: number;
    tradesCount: number;
    pctOfTotalExchangeFees: number;
  }>;
  
  // Distribuição por Rede Blockchain:
  byNetwork: Array<{
    network: string;
    gasPaidUsd: number;
    transfersCount: number;
    avgFeeUsd: number;
  }>;
  
  items: ProfitAndFeeLedgerItem[];
}

