export interface ExchangeApiCredential {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isActive: boolean;
  isTestnet: boolean;
  connectedAt?: number;
  lastTestedAt?: number;
  balanceUsdt?: number;
}

export type ExecutionStage = 
  | 'IDLE' 
  | 'PRE_FLIGHT_CHECK'
  | 'QUANTUM_REBALANCE' 
  | 'BUYING' 
  | 'TRANSFERRING' 
  | 'DEPOSIT_CONFIRMING' 
  | 'SELLING' 
  | 'PROFIT_SECURED'
  | 'COMPLETED'
  | 'FAILED';

export interface QuantumRebalanceStep {
  required: boolean;
  fromExchange: string;
  toExchange: string;
  network: string;
  transferFeeUsd: number;
  txHash: string;
  durationSeconds: number;
  status: 'PENDING' | 'TRANSFERRING' | 'CONFIRMED' | 'SKIPPED';
  timestamp: number;
}

export interface AutoExecutionOrder {
  id: string;
  opportunityId: string;
  symbol: string;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  networkName: string;
  networkProtocol: string;
  capitalUsd: number;
  buyPrice: number;
  sellPrice: number;
  status: 'PENDING' | 'BUYING' | 'TRANSFERRING' | 'SELLING' | 'COMPLETED' | 'FAILED';
  activeStage?: ExecutionStage;
  currentStep: number;
  totalSteps: number;
  stepDetails: string;
  buyTxId?: string;
  withdrawTxId?: string;
  sellTxId?: string;
  actualProfitUsd?: number;
  actualProfitPct?: number;
  grossReturnUsd?: number;
  totalFeesUsd?: number;
  buyFeeUsd?: number;
  sellFeeUsd?: number;
  networkGasUsd?: number;
  slippageUsd?: number;
  quantumFeeUsd?: number;
  tokensAmount?: number;
  isSimulated: boolean;
  logs: string[];
  createdAt: number;
  completedAt?: number;
  error?: string;
  // Cérebro Quântico & Infraestrutura Segura
  quantumRebalance?: QuantumRebalanceStep;
  liquidityCapUsd?: number;
  orderBookDepthChecked?: boolean;
  sacRegVerified?: boolean;
  capitalLocationAfterTrade?: string;
}

export interface BotConfig {
  autoTradeEnabled: boolean;
  minNetSpreadPct: number;
  maxCapitalPerTradeUsd: number;
  executionMode: 'INSTANT_DUAL_LEG' | '3_STEP_BLOCKCHAIN' | 'SIMULATION_SAFE';
  allowedExchanges: string[];
  require100Approved: boolean;
  stopLossPct: number;
  maxDailyTrades: number;
  // Cérebro Quântico (Quantum Balance Routing)
  quantumRoutingEnabled?: boolean;
  autoRebalanceUSDT?: boolean;
  preferLocalBalance?: boolean;
  currentCapitalExchange?: string;
  currentAvailableUsdt?: number;
  fastestNetworkForRebalance?: 'AUTO_CHEAPEST' | 'BEP20' | 'SOLANA' | 'ARBITRUM' | 'TRC20';
}

