import React, { useState, useEffect, useMemo } from 'react';
import { UserAccount, CreateClientPayload } from '../types/auth';
import { PricingPlanConfig } from '../types/enterprise';
import { 
  fetchAdminUsersApi, createClientUserApi, updateClientUserApi, deleteClientUserApi,
  fetchPricingPlansApi, updatePricingPlanApi, resetUserPasswordApi, triggerPaymentWebhookApi 
} from '../services/api';
import { 
  Users, UserPlus, ShieldCheck, Crown, Clock, CheckCircle2, 
  XCircle, Copy, Check, MessageSquare, Trash2, RefreshCw, 
  DollarSign, AlertTriangle, Calendar, Phone, Mail, Key, Sparkles,
  ExternalLink, Filter, Search, ArrowUpDown, Edit3, Send, AlertCircle,
  Webhook, Shield, Lock, Sliders, Zap, CheckCircle
} from 'lucide-react';

interface AdminClientManagementViewProps {
  currentUser: UserAccount | null;
}

export const AdminClientManagementView: React.FC<AdminClientManagementViewProps> = ({
  currentUser,
}) => {
  const [users, setUsers] = useState<Array<UserAccount & { passwordPlain?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(UserAccount & { passwordPlain?: string }) | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBillingId, setCopiedBillingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterPreset, setDateFilterPreset] = useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | '30DAYS' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'BLOCKED'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'LIFETIME_VIP'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [sortBy, setSortBy] = useState<'CONTRACT_DESC' | 'CONTRACT_ASC' | 'EXPIRY_ASC' | 'NAME_ASC' | 'FEE_DESC'>('CONTRACT_DESC');

  // Form State for New User
  const [formData, setFormData] = useState<CreateClientPayload>({
    name: '',
    email: '',
    password: '',
    plan: 'MONTHLY',
    durationDays: 30,
    maxCapitalUsd: 10000,
    monthlyFee: 50,
    contractStartDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'PAID',
    notes: '',
    phone: '',
  });

  // CEO Governance & SaaS State
  const [plans, setPlans] = useState<PricingPlanConfig[]>([]);
  const [editingPlan, setEditingPlan] = useState<PricingPlanConfig | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<(UserAccount & { passwordPlain?: string }) | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [webhookTestEmail, setWebhookTestEmail] = useState('novo.cliente@gmail.com');
  const [webhookTestPlan, setWebhookTestPlan] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [webhookProvider, setWebhookProvider] = useState<'Kiwify' | 'Mercado Pago' | 'Stripe'>('Kiwify');
  const [isTriggeringWebhook, setIsTriggeringWebhook] = useState(false);
  const [isCopiedWebhookUrl, setIsCopiedWebhookUrl] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, plansData] = await Promise.all([
        fetchAdminUsersApi(),
        fetchPricingPlansApi(),
      ]);
      setUsers(usersData);
      setPlans(plansData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = loadData;

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'ARBX-';
    for (let i = 0; i < 6; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormData((prev) => ({ ...prev, password: res }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Preencha pelo menos Nome e E-mail do cliente.');
      return;
    }

    try {
      const result = await createClientUserApi(formData);
      setFeedbackMessage(`Cliente ${result.user.name} cadastrado com sucesso! Mensalidade e contrato ativos.`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        plan: 'MONTHLY',
        durationDays: 30,
        maxCapitalUsd: 10000,
        monthlyFee: 50,
        contractStartDate: new Date().toISOString().slice(0, 10),
        paymentStatus: 'PAID',
        notes: '',
        phone: '',
      });
      loadUsers();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar cliente.');
    }
  };

  const handleUpdateEditingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateClientUserApi(editingUser.id, {
        name: editingUser.name,
        phone: editingUser.phone,
        plan: editingUser.plan,
        status: editingUser.status,
        maxCapitalUsd: editingUser.maxCapitalUsd,
        notes: editingUser.notes,
        contractStartDate: editingUser.contractStartDate,
        monthlyFee: editingUser.monthlyFee,
        paymentStatus: editingUser.paymentStatus,
        password: editingUser.passwordPlain,
      } as any);

      setFeedbackMessage(`Contrato de ${editingUser.name} atualizado com sucesso!`);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar cliente.');
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await updateClientUserApi(user.id, { status: nextStatus });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status.');
    }
  };

  const handleAddDays = async (user: UserAccount, days: number) => {
    try {
      await updateClientUserApi(user.id, { 
        addDays: days, 
        status: 'ACTIVE',
        paymentStatus: 'PAID' as any,
      });
      setFeedbackMessage(`+${days} dias de mensalidade renovados para ${user.name}!`);
      loadUsers();
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao renovar mensalidade.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o cliente ${name}? O acesso será revogado imediatamente.`)) {
      return;
    }
    try {
      await deleteClientUserApi(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover cliente.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordInput.trim()) return;
    try {
      await resetUserPasswordApi(resetPasswordUser.id, newPasswordInput.trim());
      setFeedbackMessage(`Senha do cliente ${resetPasswordUser.name} redefinida com sucesso para "${newPasswordInput.trim()}"!`);
      setResetPasswordUser(null);
      setNewPasswordInput('');
      loadData();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao redefinir senha');
    }
  };

  const handleSimulatePaymentWebhook = async (event: 'payment.approved' | 'payment.refunded') => {
    if (!webhookTestEmail.trim()) {
      alert('Informe o e-mail para simular o webhook.');
      return;
    }
    setIsTriggeringWebhook(true);
    try {
      const selectedPlanData = plans.find((p) => p.id === webhookTestPlan);
      const res = await triggerPaymentWebhookApi({
        email: webhookTestEmail.trim(),
        name: webhookTestEmail.split('@')[0],
        plan: webhookTestPlan,
        event,
        amount: selectedPlanData?.priceUsd || 49.90,
        provider: webhookProvider,
      });
      setFeedbackMessage(res.message);
      loadData();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Erro ao processar webhook');
    } finally {
      setIsTriggeringWebhook(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await updatePricingPlanApi(editingPlan.id, editingPlan);
      setFeedbackMessage(`Configurações do ${editingPlan.name} atualizadas!`);
      setEditingPlan(null);
      loadData();
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar plano');
    }
  };

  // WhatsApp Welcome Message
  const handleCopyCredentialsMessage = (user: UserAccount & { passwordPlain?: string }) => {
    const contractDate = user.contractStartDate 
      ? new Date(user.contractStartDate).toLocaleDateString('pt-BR') 
      : new Date(user.createdAt).toLocaleDateString('pt-BR');

    const expiryText = user.expiresAt 
      ? new Date(user.expiresAt).toLocaleDateString('pt-BR')
      : 'Acesso Vitalício VIP (Sem expiração)';
    
    const feeText = user.monthlyFee ? `$${user.monthlyFee} USDT/mês` : 'Incluso';

    const msg = `🚀 *BEM-VINDO AO ARBITRX — SISTEMA DE ARBITRAGEM CRIPTO* 🚀\n\n` +
      `Olá *${user.name}*, seu acesso à plataforma ArbitrX foi liberado com sucesso!\n\n` +
      `📋 *Detalhes do Contrato & Acesso:*\n` +
      `• *Painel de Acesso:* ${window.location.origin}\n` +
      `• *Seu E-mail:* ${user.email}\n` +
      `• *Sua Senha:* ${user.passwordPlain || 'admin123'}\n` +
      `• *Data de Adesão:* ${contractDate}\n` +
      `• *Plano Contratado:* ${user.plan === 'MONTHLY' ? 'Mensalidade' : user.plan}\n` +
      `• *Valor da Mensalidade:* ${feeText}\n` +
      `• *Próximo Vencimento:* ${expiryText}\n\n` +
      `⚡ *Recursos Liberados:*\n` +
      `✅ Scanner em tempo real em 8 exchanges oficiais\n` +
      `✅ Bilhetes com Trava de Liquidez imediata\n` +
      `✅ Conferência de rede de saque SAC e REG\n` +
      `✅ Robô de Automação via API das corretoras\n` +
      `✅ 6 Agentes de IA auditando os livros de ofertas\n\n` +
      `Qualquer dúvida ou suporte, estou à disposição! Bons lucros!`;

    navigator.clipboard.writeText(msg);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // WhatsApp Billing / Renewal Reminder Message
  const handleCopyBillingReminder = (user: UserAccount & { passwordPlain?: string }) => {
    const expiryText = user.expiresAt 
      ? new Date(user.expiresAt).toLocaleDateString('pt-BR')
      : 'Hoje';
    const feeText = user.monthlyFee ? `$${user.monthlyFee} USDT` : 'sua mensalidade';

    const msg = `🔔 *LEMBRETE DE RENOVAÇÃO DE MENSALIDADE — ARBITRX* 🔔\n\n` +
      `Olá *${user.name}*, tudo bem?\n\n` +
      `Passando para lembrar que sua mensalidade do sistema de arbitragem *ArbitrX* vence em *${expiryText}*.\n\n` +
      `💰 *Valor da Renovação:* ${feeText}\n\n` +
      `Para manter seu scanner e automação via API 100% ativos sem interrupções, realize o pagamento da mensalidade e me envie o comprovante para renovar imediatamente seu acesso por mais 30 dias!\n\n` +
      `Agradecemos a confiança e ótimas operações de arbitragem!`;

    navigator.clipboard.writeText(msg);
    setCopiedBillingId(user.id);
    setTimeout(() => setCopiedBillingId(null), 2500);
  };

  // Preset Date Filter Handlers
  const handleSetDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | '30DAYS') => {
    setDateFilterPreset(preset);
    const now = new Date();
    
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7DAYS') {
      const d7 = new Date(now.getTime() - 7 * 86400000);
      setStartDate(d7.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === '30DAYS') {
      const d30 = new Date(now.getTime() - 30 * 86400000);
      setStartDate(d30.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Text Search (Name, Email, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = u.phone ? u.phone.toLowerCase().includes(q) : false;
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      // 2. Date of Adhesion (Data de Adesão do Contrato)
      const contractTime = u.contractStartDate || u.createdAt;
      if (startDate) {
        const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
        if (contractTime < startTimestamp) return false;
      }
      if (endDate) {
        const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
        if (contractTime > endTimestamp) return false;
      }

      // 3. Status Filter
      const isLifetime = u.plan === 'LIFETIME_VIP' || !u.expiresAt;
      const daysLeft = !isLifetime && u.expiresAt ? Math.ceil((u.expiresAt - Date.now()) / 86400000) : 9999;
      const isExpiringSoon = !isLifetime && daysLeft <= 7 && daysLeft > 0;
      const isExpired = !isLifetime && daysLeft <= 0;

      if (statusFilter === 'ACTIVE') {
        if (u.status !== 'ACTIVE' || isExpired) return false;
      } else if (statusFilter === 'EXPIRING_SOON') {
        if (!isExpiringSoon || u.status === 'BLOCKED') return false;
      } else if (statusFilter === 'EXPIRED') {
        if (!isExpired && u.status !== 'EXPIRED') return false;
      } else if (statusFilter === 'BLOCKED') {
        if (u.status !== 'BLOCKED') return false;
      }

      // 4. Plan Filter
      if (planFilter !== 'ALL') {
        if (u.plan !== planFilter) return false;
      }

      // 5. Payment Status Filter
      if (paymentStatusFilter !== 'ALL') {
        if (u.paymentStatus !== paymentStatusFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'CONTRACT_DESC') {
        const tA = a.contractStartDate || a.createdAt;
        const tB = b.contractStartDate || b.createdAt;
        return tB - tA;
      } else if (sortBy === 'CONTRACT_ASC') {
        const tA = a.contractStartDate || a.createdAt;
        const tB = b.contractStartDate || b.createdAt;
        return tA - tB;
      } else if (sortBy === 'EXPIRY_ASC') {
        const expA = a.expiresAt || Infinity;
        const expB = b.expiresAt || Infinity;
        return expA - expB;
      } else if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'FEE_DESC') {
        return (b.monthlyFee || 0) - (a.monthlyFee || 0);
      }
      return 0;
    });
  }, [users, searchQuery, startDate, endDate, statusFilter, planFilter, paymentStatusFilter, sortBy]);

  // Overall Financial Metrics
  const clientsOnly = users.filter((u) => u.role === 'CLIENT');
  const totalClients = clientsOnly.length;
  const activeClients = clientsOnly.filter((u) => u.status === 'ACTIVE' && (!u.expiresAt || u.expiresAt > Date.now())).length;
  
  // Clients expiring in <= 7 days (ready for billing)
  const expiringSoonCount = clientsOnly.filter((u) => {
    if (u.plan === 'LIFETIME_VIP' || !u.expiresAt) return false;
    const days = Math.ceil((u.expiresAt - Date.now()) / 86400000);
    return days <= 7 && days > 0;
  }).length;

  const expiredCount = clientsOnly.filter((u) => {
    if (u.plan === 'LIFETIME_VIP' || !u.expiresAt) return false;
    return u.expiresAt < Date.now();
  }).length;

  // Monthly Recurring Revenue estimate (MRR)
  const estimatedMonthlyRevenue = clientsOnly
    .filter((u) => u.status === 'ACTIVE')
    .reduce((acc, u) => acc + (u.monthlyFee || 50), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Painel do Administrador Master
              </span>
              <span className="text-xs text-slate-400 font-mono">marcostradereuropa@gmail.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestão de Contratos, Mensalidades &amp; Clientes
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Controle completo de contratos de mensalidade com filtros por data de adesão, vencimento de licença, disparo de cobrança e boas-vindas com 1 clique para WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:translate-y-px"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Contrato / Cliente</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* KPI Financial & Subscription Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Total de Clientes</span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">{totalClients}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mensalidades Ativas</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{activeClients}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Vencendo em 7 dias</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{expiringSoonCount}</div>
            <span className="text-[10px] text-amber-300/80">Cobrar renovação</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Expirados / Atrasados</span>
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">{expiredCount}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Faturamento Mensal (MRR)</span>
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
              ${estimatedMonthlyRevenue.toLocaleString('en-US')}
            </div>
            <span className="text-[10px] text-slate-400">USDT recorrente</span>
          </div>
        </div>
      </div>

      {/* CEO SaaS GOVERNANCE STRIP: 3-TIER PLANS & PAYMENT WEBHOOK INTEGRATION */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Painel do CEO: Governança SaaS &amp; Planos Automatizados</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Exclusivo Super Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gestão dos 3 tiers de assinatura (preços, vigência e limites de banca) e Webhook de pagamento instantâneo.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Tiers of Subscription Plans */}
        <div>
          <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
            <span>Tiers de Assinatura Oficial (Mensal, Trimestral &amp; Anual):</span>
            <span className="text-[11px] text-purple-400 font-mono">Clique em "Editar Tier" para alterar preços</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-xl transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{plan.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {plan.durationDays} dias
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      R$ {plan.priceBrl.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (~${plan.priceUsd} USDT)
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    Limite Operacional: <strong className="text-white">${plan.maxCapitalUsd.toLocaleString()} USDT</strong>
                  </div>

                  <ul className="mt-2.5 space-y-1 text-[11px] text-slate-400">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {plan.activeUsersCount} membros ativos
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-500/40 transition-colors flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Editar Tier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhook Gateway Integration Box (Kiwify, Mercado Pago, Stripe) */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Webhook de Pagamento Integrado (Kiwify, Mercado Pago, Stripe)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                POST /api/webhooks/payment
              </span>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/api/webhooks/payment`;
                  navigator.clipboard.writeText(url);
                  setIsCopiedWebhookUrl(true);
                  setTimeout(() => setIsCopiedWebhookUrl(false), 2000);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                {isCopiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedWebhookUrl ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Plataforma Checkout</label>
              <select
                value={webhookProvider}
                onChange={(e) => setWebhookProvider(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="Kiwify">Kiwify Checkout</option>
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Stripe">Stripe Billing</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">E-mail do Comprador</label>
              <input
                type="email"
                value={webhookTestEmail}
                onChange={(e) => setWebhookTestEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Plano Vendido</label>
              <select
                value={webhookTestPlan}
                onChange={(e) => setWebhookTestPlan(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="MONTHLY">Plano Mensal (30 dias)</option>
                <option value="QUARTERLY">Plano Trimestral (90 dias)</option>
                <option value="ANNUAL">Plano Anual VIP (365 dias)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => handleSimulatePaymentWebhook('payment.approved')}
                disabled={isTriggeringWebhook}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simular Aprovação</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER TOOLBAR (DATA DE ADESÃO, STATUS, PLANO, ORDENAÇÃO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Filtros Avançados por Data de Adesão, Mensalidade e Status</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredUsers.length} de {users.length} cadastros
          </span>
        </div>

        {/* Row 1: Search + Date Presets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Date of Adhesion Quick Presets */}
          <div className="md:col-span-8 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Data de Adesão:
            </span>
            {[
              { id: 'ALL', label: 'Todas as Datas' },
              { id: 'TODAY', label: 'Hoje' },
              { id: '7DAYS', label: 'Últimos 7 dias' },
              { id: 'THIS_MONTH', label: 'Este Mês' },
              { id: '30DAYS', label: 'Últimos 30 dias' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSetDatePreset(p.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilterPreset === p.id
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 font-bold'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Custom Date Range (De / Até) + Status + Plan + Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Adesão A Partir de:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilterPreset('CUSTOM');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Adesão Até:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilterPreset('CUSTOM');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Status do Acesso:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="EXPIRING_SOON">Vencendo em 7 dias (Cobrança)</option>
              <option value="EXPIRED">Expirados</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tipo de Plano:</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Todos os Planos</option>
              <option value="MONTHLY">📅 Mensalidade (30 dias)</option>
              <option value="QUARTERLY">⚡ Trimestral (90 dias)</option>
              <option value="ANNUAL">⭐ Anual (365 dias)</option>
              <option value="LIFETIME_VIP">💎 Vitalício VIP</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Status Mensalidade:</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Todas as Situações</option>
              <option value="PAID">Pago / Em Dia</option>
              <option value="PENDING">Pendente / Aguardando</option>
              <option value="OVERDUE">Atrasado</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-purple-400" />
              Ordenar Por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="CONTRACT_DESC">Adesão Mais Recente</option>
              <option value="CONTRACT_ASC">Adesão Mais Antiga</option>
              <option value="EXPIRY_ASC">Vencimento Próximo</option>
              <option value="NAME_ASC">Nome (A - Z)</option>
              <option value="FEE_DESC">Maior Mensalidade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Contracts & Clients */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Lista de Contratos &amp; Clientes Cadastrados</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredUsers.length}
            </span>
          </div>

          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Recarregar cadastros"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cliente / Contato</th>
                <th className="py-3 px-4">Data de Adesão</th>
                <th className="py-3 px-4">Mensalidade &amp; Vencimento</th>
                <th className="py-3 px-4">Status Acesso</th>
                <th className="py-3 px-4">Senha / Login</th>
                <th className="py-3 px-4 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredUsers.map((user) => {
                const isAdmin = user.role === 'ADMIN';
                const isLifetime = user.plan === 'LIFETIME_VIP' || !user.expiresAt;
                
                let daysLeft = 0;
                let isExpired = false;
                if (!isLifetime && user.expiresAt) {
                  daysLeft = Math.ceil((user.expiresAt - Date.now()) / 86400000);
                  isExpired = daysLeft <= 0;
                }
                const isExpiringSoon = !isLifetime && daysLeft <= 7 && daysLeft > 0;

                const contractFormatted = user.contractStartDate
                  ? new Date(user.contractStartDate).toLocaleDateString('pt-BR')
                  : new Date(user.createdAt).toLocaleDateString('pt-BR');

                const expiryFormatted = user.expiresAt
                  ? new Date(user.expiresAt).toLocaleDateString('pt-BR')
                  : 'Vitalício';

                return (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAdmin 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isAdmin && <Crown className="w-3.5 h-3.5 text-purple-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Data de Adesão */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-white text-[11px] font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>{contractFormatted}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {Math.floor((Date.now() - (user.contractStartDate || user.createdAt)) / 86400000)} dias de contrato
                      </div>
                    </td>

                    {/* Mensalidade & Vencimento */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="text-emerald-400 font-mono">
                            {user.monthlyFee ? `$${user.monthlyFee}/mês` : 'Incluso'}
                          </span>
                          <span className="text-[10px] text-slate-400">· {user.plan}</span>
                        </div>
                        
                        <div className="text-[10px] mt-1 flex items-center gap-1">
                          <span className="text-slate-400">Vencimento:</span>
                          <span className="font-mono font-semibold text-slate-200">{expiryFormatted}</span>
                          {!isLifetime && (
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              isExpired 
                                ? 'bg-rose-500/20 text-rose-300' 
                                : isExpiringSoon 
                                ? 'bg-amber-500/20 text-amber-300' 
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {isExpired ? `Atrasado ${Math.abs(daysLeft)}d` : `${daysLeft}d restantes`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                        user.status === 'ACTIVE' && !isExpired
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : user.status === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' && !isExpired ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {user.status === 'ACTIVE' && !isExpired ? 'Ativo' : user.status === 'BLOCKED' ? 'Bloqueado' : 'Expirado'}
                      </span>
                    </td>

                    {/* Senha e Acesso */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                        {user.passwordPlain || 'admin123'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isAdmin && (
                          <>
                            {/* Renovar Mensalidade (+30 dias) */}
                            <button
                              onClick={() => handleAddDays(user, 30)}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-colors"
                              title="Renovar Mensalidade (+30 dias)"
                            >
                              +30d
                            </button>

                            {/* WhatsApp Cobrança de Mensalidade */}
                            <button
                              onClick={() => handleCopyBillingReminder(user)}
                              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                                copiedBillingId === user.id
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                              }`}
                              title="Copiar Lembrete de Cobrança / Renovação para WhatsApp"
                            >
                              {copiedBillingId === user.id ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                              <span className="text-[10px] hidden sm:inline">Cobrar</span>
                            </button>

                            {/* WhatsApp Boas-Vindas */}
                            <button
                              onClick={() => handleCopyCredentialsMessage(user)}
                              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                                copiedId === user.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                              }`}
                              title="Copiar dados de acesso de boas-vindas para WhatsApp"
                            >
                              {copiedId === user.id ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            </button>

                            {/* Editar Contrato */}
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Editar contrato de mensalidade"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Redefinição Rápida de Senha */}
                            <button
                              onClick={() => {
                                setResetPasswordUser(user);
                                setNewPasswordInput('');
                              }}
                              className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 transition-colors"
                              title="Redefinição rápida de senha pelo CEO"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Bloquear / Ativar */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg text-xs transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'text-amber-400 hover:bg-amber-950/40'
                                  : 'text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                              title={user.status === 'ACTIVE' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                            >
                              {user.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Excluir cadastro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRAR NOVO CONTRATO / CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-purple-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cadastrar Novo Contrato / Mensalidade</h3>
                  <p className="text-xs text-slate-400">Venda de acesso e gestão de mensalistas</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Completo do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Rafael Santos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail de Login do Cliente *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="rafael@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Gerar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Ex: ARBX-89X2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    WhatsApp do Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+55 11 99999-8888"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Adesão do Contrato *
                  </label>
                  <input
                    type="date"
                    required
                    value={typeof formData.contractStartDate === 'string' ? formData.contractStartDate : ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contractStartDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Plano Contratado *
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      let days = 30;
                      let fee = 50;
                      if (p === 'LIFETIME_VIP') { days = 0; fee = 990; }
                      else if (p === 'ANNUAL') { days = 365; fee = 390; }
                      else if (p === 'QUARTERLY') { days = 90; fee = 120; }
                      setFormData((prev) => ({ ...prev, plan: p, durationDays: days, monthlyFee: fee }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="MONTHLY">📅 Mensalidade (30 dias)</option>
                    <option value="QUARTERLY">⚡ Trimestral (90 dias)</option>
                    <option value="ANNUAL">⭐ Anual (365 dias)</option>
                    <option value="LIFETIME_VIP">💎 Vitalício VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor da Mensalidade (USDT / R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status Pagamento
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentStatus: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="PAID">✅ Pago / Em Dia</option>
                    <option value="PENDING">⏳ Pendente / Aguardando</option>
                    <option value="OVERDUE">⚠️ Atrasado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações do Contrato (Comprovante, Chave Pix, USDT Tx...)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Mensalidade paga via Pix em 05/11. Chave TRC20 enviada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar e Liberar Acesso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CONTRATO DO CLIENTE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-purple-950/30">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Editar Contrato: {editingUser.name}</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEditingUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Plano</label>
                  <select
                    value={editingUser.plan}
                    onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="MONTHLY">📅 Mensalidade</option>
                    <option value="QUARTERLY">⚡ Trimestral</option>
                    <option value="ANNUAL">⭐ Anual</option>
                    <option value="LIFETIME_VIP">💎 Vitalício VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor Mensalidade</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.monthlyFee || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Situação Pagamento</label>
                  <select
                    value={editingUser.paymentStatus || 'PAID'}
                    onChange={(e) => setEditingUser({ ...editingUser, paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="PAID">✅ Pago / Em Dia</option>
                    <option value="PENDING">⏳ Pendente</option>
                    <option value="OVERDUE">⚠️ Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data de Adesão do Contrato</label>
                  <input
                    type="date"
                    value={editingUser.contractStartDate ? new Date(editingUser.contractStartDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => setEditingUser({ ...editingUser, contractStartDate: new Date(e.target.value).getTime() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status do Acesso</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="EXPIRED">Expirado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações do Contrato</label>
                <textarea
                  rows={2}
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-purple-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REDEFINIÇÃO RÁPIDA DE SENHA PELO CEO */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-purple-950/40">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Redefinir Senha do Membro</h3>
                  <p className="text-[11px] text-slate-400">{resetPasswordUser.name} ({resetPasswordUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nova Senha de Acesso <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Ex: novaSenha2026@"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-[11px] text-purple-200">
                A nova senha passará a valer imediatamente para este membro sem necessidade de confirmação por e-mail.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDITAR TIER DE ASSINATURA SAAS */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-purple-950/40">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Editar Tier: {editingPlan.name}</h3>
                  <p className="text-[11px] text-slate-400">Configuração de Preços &amp; Limites de Licença</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço em Reais (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.priceBrl}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceBrl: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço em Dólares (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.priceUsd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vigência (Dias)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.durationDays}
                    onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value, 10) || 30 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Limite de Banca (USDT)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.maxCapitalUsd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxCapitalUsd: parseFloat(e.target.value) || 10000 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações do Tier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
