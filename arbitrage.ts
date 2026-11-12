export interface NetworkExchangeStatus {
  deposit: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  withdrawal: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  minWithdrawal: number;
  fee: number;
}

export interface NetworkRoute {
  networkId: string;
  networkName: string;
  protocol: string;
  withdrawalFeeTokens: number;
  estimatedFeeUsd: number;
  avgConfirmationTime: string;
  avgBlockTimeSeconds: number;
  memoRequired: boolean;
  statusByExchange: Record<string, NetworkExchangeStatus>;
}

export interface AssetNetworks {
  symbol: string;
  name: string;
  networks: NetworkRoute[];
}

export interface OrderBookLevel {
  price: number;
  qty: number;
  totalUsd: number;
}

export interface OrderBookResponse {
  exchange: string;
  symbol: string;
  pair: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  pair: string;
  buyExchange: string;
  buyPrice: number;
  buyAvailableQty: number;
  buyAvailableUsd: number;
  
  sellExchange: string;
  sellPrice: number;
  sellAvailableQty: number;
  sellAvailableUsd: number;

  grossSpreadPct: number;
  bestNetwork: NetworkRoute | null;
  allMatchingNetworks: NetworkRoute[];
  networkStatus: 'ACTIVE' | 'PARTIAL_SUSPENDED' | 'NO_COMMON_NETWORK';
  networkNotes: string[];

  // Liquidity bottleneck calculation requested by user
  maxExecutableUsd: number;
  maxExecutableTokens: number;
  liquidityBottleneck: 'BUY_SIDE' | 'SELL_SIDE' | 'BALANCED';
  liquidityAdvice: string;

  // SAC / REG (Saque & Depósito) status and network citation requested by user
  sacStatus: 'DISPONÍVEL' | 'SUSPENSO';
  regStatus: 'DISPONÍVEL' | 'SUSPENSO';
  sacExchange: string; // Exchange where withdrawal (saque) happens
  regExchange: string; // Exchange where deposit (registro/depósito) happens
  availableNetworkName: string; // Explicitly cited withdrawal network
  availableNetworkProtocol: string;
  withdrawalFeeTokenDisplay: string;
  withdrawalFeeUsdDisplay: string;
  
  // Final Net profit with ALL fees fully subtracted
  netProfitFinalUsd: number;
  netProfitFinalPct: number;
  feeWaterfall: {
    buyFeeUsd: number;
    networkFeeUsd: number;
    sellFeeUsd: number;
    slippageUsd: number;
    totalFeesUsd: number;
  };

  estimatedProfitUsd: number;
  estimatedNetSpreadPct: number;
  transferFeeUsd: number;
  buyTakerFeeUsd: number;
  sellTakerFeeUsd: number;
  slippagePct: number;
  
  isFeasible: boolean;
  feasibilityReason: string;
  safetyScore: number; // 0 - 100%
  timestamp: number;
  volume24hBuy?: number;
  volume24hSell?: number;
  isContractVerified?: boolean;
  auditSource?: string;
  category?: 'MEME' | 'ALTCOIN' | 'L1_L2' | 'DEFI';
}

export interface ArbitrageTicket {
  ticketNumber: string;
  opportunity: ArbitrageOpportunity;
  generatedAt: number;
  validUntil: number;
  maxBuyUsd: number;
  maxSellUsd: number;
  maxSafeCapitalUsd: number;
  recommendedCapitalUsd: number;
  projectedNetProfitUsd: number;
  netMarginPct: number;
  
  // Real live order book audit
  liveOrderBookVerified?: boolean;
  liveVerifiedAt?: number;
  auditSource?: string;
  buyLiveAsk?: number;
  sellLiveBid?: number;
  buyLiveDepthUsd?: number;
  sellLiveDepthUsd?: number;
  isLiveSpreadValid?: boolean;

  // Explicit SAC/REG, Cited Network, and Fee Waterfall on the ticket
  sacStatus: 'DISPONÍVEL' | 'SUSPENSO';
  regStatus: 'DISPONÍVEL' | 'SUSPENSO';
  citedNetworkName: string;
  availableNetworkName?: string;
  availableNetworkProtocol?: string;
  citedNetworkFeeTokens: string;
  citedNetworkFeeUsd: string;
  netProfitAfterAllFeesUsd: number;
  netProfitAfterAllFeesPct: number;
  feeWaterfall: {
    buyFeeUsd: number;
    networkFeeUsd: number;
    sellFeeUsd: number;
    slippageUsd: number;
    totalFeesUsd: number;
  };
  steps: {
    order: number;
    action: string;
    exchange: string;
    detail: string;
    value: string;
    status: 'READY' | 'WARNING' | 'CRITICAL';
  }[];
  agentAudit: {
    scannerAgent: { status: 'APPROVED' | 'FLAGGED'; note: string };
    routeAgent: { status: 'APPROVED' | 'FLAGGED'; note: string };
    liquidityAgent: { status: 'APPROVED' | 'FLAGGED'; note: string };
    riskAgent: { status: 'APPROVED' | 'FLAGGED'; note: string };
  };
  aiInsight?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  floor?: number;
  floorName?: string;
  department?: string;
  specialty: string;
  avatarIcon: string;
  status: 'ONLINE' | 'ACTIVE_AUDITING' | 'SCANNING' | 'ALERT';
  itemsProcessed: number;
  lastAction: string;
  currentVerdict: string;
  logs?: string[];
  metrics?: {
    latencyMs?: number;
    activeChannels?: number;
    precisionRate?: string;
    pairsEvaluated?: number;
  };
}

export interface TradeSimulationResult {
  symbol: string;
  capitalUsd: number;
  buyExchange: string;
  sellExchange: string;
  networkUsed: NetworkRoute | null;
  weightedBuyPrice: number;
  buySlippage: number;
  coinsBought: number;
  networkFeeCoins: number;
  transferFeeUsd: number;
  coinsArrived: number;
  weightedSellPrice: number;
  sellSlippage: number;
  receivedUsd: number;
  buyTakerFeeUsd: number;
  sellTakerFeeUsd: number;
  totalFeesUsd: number;
  finalCapitalUsd: number;
  netProfitUsd: number;
  netRoiPct: number;
  isProfitable: boolean;
  timestamp: number;
}

export interface ScannerFilterState {
  searchQuery: string;
  minNetSpreadPct: number;
  minGrossSpreadPct: number;
  capitalUsd: number;
  takerFeePct: number;
  onlyActiveNetworks: boolean;
  onlyProfitable: boolean;
  only100PercentApproved: boolean; // 100% Approved tickets (SAC OK + REG OK + Active Network + Profit > 0)
  selectedExchanges: string[];
  selectedNetworkIds: string[];
  viewMode: 'tickets' | 'by_exchange_pairs' | 'table';
  selectedHousePair?: string;
  selectedCategory?: string; // 'ALL' | 'MEME' | 'ALTCOIN' | 'L1_L2' | 'DEFI'
  onlyHighProfit?: boolean; // Spreads > 2.5%
}

export interface ExchangeFeeRate {
  maker: number;
  taker: number;
  makerPctDisplay: string;
  takerPctDisplay: string;
  name: string;
  withdrawalUsdtTrc20: number;
  withdrawalUsdtBep20: number;
  withdrawalUsdtErc20: number;
  withdrawalUsdtSol: number;
}

export const REAL_EXCHANGE_FEE_RATES: Record<string, ExchangeFeeRate> = {
  binance: {
    maker: 0.0010,
    taker: 0.0010,
    makerPctDisplay: '0.10%',
    takerPctDisplay: '0.10%',
    name: 'Binance',
    withdrawalUsdtTrc20: 1.50,
    withdrawalUsdtBep20: 0.29,
    withdrawalUsdtErc20: 4.20,
    withdrawalUsdtSol: 0.60,
  },
  bybit: {
    maker: 0.0010,
    taker: 0.0010,
    makerPctDisplay: '0.10%',
    takerPctDisplay: '0.10%',
    name: 'Bybit',
    withdrawalUsdtTrc20: 1.50,
    withdrawalUsdtBep20: 0.30,
    withdrawalUsdtErc20: 4.00,
    withdrawalUsdtSol: 0.80,
  },
  okx: {
    maker: 0.0008,
    taker: 0.0010,
    makerPctDisplay: '0.08%',
    takerPctDisplay: '0.10%',
    name: 'OKX',
    withdrawalUsdtTrc20: 1.50,
    withdrawalUsdtBep20: 0.30,
    withdrawalUsdtErc20: 3.80,
    withdrawalUsdtSol: 0.70,
  },
  kucoin: {
    maker: 0.0010,
    taker: 0.0010,
    makerPctDisplay: '0.10%',
    takerPctDisplay: '0.10%',
    name: 'KuCoin',
    withdrawalUsdtTrc20: 2.00,
    withdrawalUsdtBep20: 0.35,
    withdrawalUsdtErc20: 4.50,
    withdrawalUsdtSol: 0.80,
  },
  bitget: {
    maker: 0.0010,
    taker: 0.0010,
    makerPctDisplay: '0.10%',
    takerPctDisplay: '0.10%',
    name: 'Bitget',
    withdrawalUsdtTrc20: 1.50,
    withdrawalUsdtBep20: 0.25,
    withdrawalUsdtErc20: 3.80,
    withdrawalUsdtSol: 0.60,
  },
  gate: {
    maker: 0.0020,
    taker: 0.0020,
    makerPctDisplay: '0.20%',
    takerPctDisplay: '0.20%',
    name: 'Gate.io',
    withdrawalUsdtTrc20: 1.80,
    withdrawalUsdtBep20: 0.35,
    withdrawalUsdtErc20: 4.50,
    withdrawalUsdtSol: 0.80,
  },
  htx: {
    maker: 0.0020,
    taker: 0.0020,
    makerPctDisplay: '0.20%',
    takerPctDisplay: '0.20%',
    name: 'HTX',
    withdrawalUsdtTrc20: 1.80,
    withdrawalUsdtBep20: 0.35,
    withdrawalUsdtErc20: 4.50,
    withdrawalUsdtSol: 0.80,
  },
  mexc: {
    maker: 0.0000,
    taker: 0.0005,
    makerPctDisplay: '0.00%',
    takerPctDisplay: '0.05%',
    name: 'MEXC',
    withdrawalUsdtTrc20: 1.20,
    withdrawalUsdtBep20: 0.20,
    withdrawalUsdtErc20: 3.50,
    withdrawalUsdtSol: 0.50,
  },
  kraken: {
    maker: 0.0025,
    taker: 0.0040,
    makerPctDisplay: '0.25%',
    takerPctDisplay: '0.40%',
    name: 'Kraken',
    withdrawalUsdtTrc20: 2.50,
    withdrawalUsdtBep20: 0.00,
    withdrawalUsdtErc20: 5.00,
    withdrawalUsdtSol: 1.00,
  },
  coinbase: {
    maker: 0.0040,
    taker: 0.0060,
    makerPctDisplay: '0.40%',
    takerPctDisplay: '0.60%',
    name: 'Coinbase',
    withdrawalUsdtTrc20: 0.00,
    withdrawalUsdtBep20: 0.00,
    withdrawalUsdtErc20: 4.80,
    withdrawalUsdtSol: 0.85,
  },
  bitfinex: {
    maker: 0.0010,
    taker: 0.0020,
    makerPctDisplay: '0.10%',
    takerPctDisplay: '0.20%',
    name: 'Bitfinex',
    withdrawalUsdtTrc20: 1.50,
    withdrawalUsdtBep20: 0.30,
    withdrawalUsdtErc20: 4.50,
    withdrawalUsdtSol: 0.80,
  },
};


