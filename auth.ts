export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  plan: 'LIFETIME_VIP' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
  expiresAt: number | null; // null for lifetime
  maxCapitalUsd: number; // 0 for unlimited
  notes?: string;
  phone?: string;
  createdAt: number;
  contractStartDate?: number; // Data de adesão formal do contrato
  monthlyFee?: number; // Valor da mensalidade (ex: $50 USDT ou R$ 297)
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  lastLoginAt?: number;
}

export interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  password?: string;
  plan: 'LIFETIME_VIP' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  durationDays?: number; // e.g. 30, 90, 365, 0 for lifetime
  maxCapitalUsd?: number;
  notes?: string;
  phone?: string;
  contractStartDate?: number | string; // Data de adesão do contrato
  monthlyFee?: number; // Valor da mensalidade
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
}
