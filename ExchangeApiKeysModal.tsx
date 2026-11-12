import React, { useState, useEffect } from 'react';
import { ExchangeApiCredential, BotConfig } from '../types/automation';
import { 
  fetchAutomationCredentialsApi, 
  saveAutomationCredentialApi, 
  deleteAutomationCredentialApi,
  saveBotConfigApi 
} from '../services/api';
import { 
  Key, ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff, 
  Trash2, Plus, Zap, Bot, ExternalLink, HelpCircle, RefreshCw, 
  Check, Lock, Activity, ArrowRight, Shield, Sparkles 
} from 'lucide-react';

interface ExchangeApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBot?: () => void;
  highlightExchange?: string | null;
}

interface ExchangeMeta {
  id: string;
  name: string;
  icon: string;
  color: string;
  badge: string;
  requiresPassphrase: boolean;
  docsUrl: string;
  instructions: string[];
}

const EXCHANGES_META: ExchangeMeta[] = [
  {
    id: 'binance',
    name: 'Binance',
    icon: '🟡',
    color: 'from-amber-500/20 to-amber-950/20 border-amber-500/40',
    badge: 'Maior Liquidez Global',
    requiresPassphrase: false,
    docsUrl: 'https://www.binance.com/pt-BR/my/settings/api-management',
    instructions: [
      'Acesse Binance > Perfil > Gerenciamento de API.',
      'Crie uma chave com o rótulo "ArbitrX_Bot".',
      'Habilite as permissões: "Permitir Leitura" e "Permitir Negociação Spot".',
      'NUNCA habilite a permissão de "Saque" para sua total segurança.',
    ],
  },
  {
    id: 'bitget',
    name: 'Bitget',
    icon: '🔵',
    color: 'from-cyan-500/20 to-cyan-950/20 border-cyan-500/40',
    badge: 'Altcoins & Taxas Zero',
    requiresPassphrase: true,
    docsUrl: 'https://www.bitget.com/pt/account/newapi',
    instructions: [
      'Acesse Bitget > Painel > Gerenciamento de Chave de API.',
      'Clique em "Criar Nova API" do tipo Negociação de Sistema.',
      'Defina uma Passphrase segura e guarde-a com cuidado.',
      'Permissões: Selecione "Spot Trading" e "Leitura".',
    ],
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    icon: '🟢',
    color: 'from-emerald-500/20 to-emerald-950/20 border-emerald-500/40',
    badge: 'Muitas Altcoins',
    requiresPassphrase: true,
    docsUrl: 'https://www.kucoin.com/account/api',
    instructions: [
      'Acesse KuCoin > Segurança da Conta > Gerenciamento de API.',
      'Crie a chave, defina a Passphrase de API (API Passphrase).',
      'Marque "General" (Leitura) e "Trade" (Negociação Spot).',
    ],
  },
  {
    id: 'okx',
    name: 'OKX',
    icon: '⚫',
    color: 'from-slate-700/30 to-slate-900 border-slate-600/40',
    badge: 'Execução Ultrarrápida',
    requiresPassphrase: true,
    docsUrl: 'https://www.okx.com/account/my-api',
    instructions: [
      'Acesse OKX > Perfil > API > Criar Chave V5.',
      'Defina o nome da API e a Passphrase.',
      'Selecione as permissões: "Read" (Leitura) e "Trade" (Negociação).',
    ],
  },
  {
    id: 'gate',
    name: 'Gate.io',
    icon: '🔴',
    color: 'from-rose-500/20 to-rose-950/20 border-rose-500/40',
    badge: 'Líder em Memecoins',
    requiresPassphrase: false,
    docsUrl: 'https://www.gate.io/myaccount/api_key_manage',
    instructions: [
      'Acesse Gate.io > Gerenciamento de Subcontas e APIs.',
      'Gere uma chave com permissão para "Spot Trading" e "Wallet Balance".',
    ],
  },
  {
    id: 'kraken',
    name: 'Kraken',
    icon: '🟣',
    color: 'from-purple-500/20 to-purple-950/20 border-purple-500/40',
    badge: 'Segurança Institucional',
    requiresPassphrase: false,
    docsUrl: 'https://www.kraken.com/u/security/api',
    instructions: [
      'Acesse Kraken > Segurança > Configurações de Chaves de API.',
      'Marque permissões: "Query Funds" e "Create/Modify Orders".',
    ],
  },
  {
    id: 'coinbase',
    name: 'Coinbase Advanced',
    icon: '🔵',
    color: 'from-blue-600/25 to-blue-950/20 border-blue-500/40',
    badge: 'Líder Institucional EUA',
    requiresPassphrase: true,
    docsUrl: 'https://www.coinbase.com/settings/api',
    instructions: [
      'Acesse Coinbase > Configurações > Chaves de API (Advanced Trade).',
      'Crie uma chave com permissão para "View" e "Trade".',
      'Guarde sua Passphrase e Secret com segurança máxima.',
      'NUNCA habilite permissões de transferência externa ou saque.',
    ],
  },
  {
    id: 'bybit',
    name: 'Bybit',
    icon: '🟠',
    color: 'from-amber-600/20 to-amber-950/20 border-amber-500/40',
    badge: 'Top 2 Global & Derivativos/Spot',
    requiresPassphrase: false,
    docsUrl: 'https://www.bybit.com/app/user/api-management',
    instructions: [
      'Acesse Bybit > Perfil > Gerenciamento de API > Criar Nova Chave.',
      'Selecione "Transação de API do Sistema".',
      'Habilite "Ordens Spot" e "Leitura de Ativos".',
      'Vincule seu IP ou deixe aberto para o robô de alta frequência.',
    ],
  },
  {
    id: 'bitfinex',
    name: 'Bitfinex',
    icon: '🟢',
    color: 'from-emerald-600/20 to-teal-950/20 border-teal-500/40',
    badge: 'Histórica & Livro Institucional',
    requiresPassphrase: false,
    docsUrl: 'https://www.bitfinex.com/api',
    instructions: [
      'Acesse Bitfinex > Conta > Chaves de API.',
      'Gere uma chave com permissões "Read Wallets" e "Write Orders".',
      'Não marque permissões de withdrawal.',
    ],
  },
  {
    id: 'mexc',
    name: 'MEXC',
    icon: '🟦',
    color: 'from-blue-500/20 to-blue-950/20 border-blue-500/40',
    badge: 'Altcoins Exclusivas',
    requiresPassphrase: false,
    docsUrl: 'https://www.mexc.com/user/openapi',
    instructions: [
      'Acesse MEXC > Perfil > Gerenciamento de API.',
      'Habilite "Trade" e "Read Information".',
    ],
  },
  {
    id: 'htx',
    name: 'HTX (Huobi)',
    icon: '⚪',
    color: 'from-slate-500/20 to-slate-950 border-slate-600/40',
    badge: 'Alta Liquidez Asiática',
    requiresPassphrase: false,
    docsUrl: 'https://www.htx.com/pt-br/apikey/',
    instructions: [
      'Acesse HTX > Perfil > Gerenciamento de API.',
      'Defina permissões de Negociação Spot e Leitura.',
    ],
  },
];

export const ExchangeApiKeysModal: React.FC<ExchangeApiKeysModalProps> = ({
  isOpen,
  onClose,
  onOpenBot,
  highlightExchange,
}) => {
  const [credentials, setCredentials] = useState<Record<string, ExchangeApiCredential>>({});
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>('binance');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'configure' | 'guide'>('configure');

  // Load credentials on open
  useEffect(() => {
    if (isOpen) {
      fetchAutomationCredentialsApi().then((data) => {
        setCredentials(data || {});
      });
      if (highlightExchange) {
        setSelectedExchangeId(highlightExchange.toLowerCase());
      }
    }
  }, [isOpen, highlightExchange]);

  // When selected exchange changes, pre-fill if exists
  useEffect(() => {
    const cred = credentials[selectedExchangeId];
    if (cred) {
      setApiKeyInput(cred.apiKey || '');
      setApiSecretInput(cred.apiSecret || '');
      setPassphraseInput(cred.passphrase || '');
    } else {
      setApiKeyInput('');
      setApiSecretInput('');
      setPassphraseInput('');
    }
    setShowSecret(false);
    setSuccessMessage(null);
  }, [selectedExchangeId, credentials]);

  if (!isOpen) return null;

  const currentMeta = EXCHANGES_META.find((m) => m.id === selectedExchangeId) || EXCHANGES_META[0];
  const isConnected = !!credentials[selectedExchangeId]?.isActive;
  const connectedCount = Object.values(credentials).filter((c) => c?.isActive).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      alert('Por favor, informe a API Key.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveAutomationCredentialApi({
        exchange: selectedExchangeId,
        apiKey: apiKeyInput.trim(),
        apiSecret: apiSecretInput.trim() || undefined,
        passphrase: passphraseInput.trim() || undefined,
      });

      setCredentials((prev) => ({ ...prev, [selectedExchangeId]: saved }));
      setSuccessMessage(`API da ${currentMeta.name} conectada e validada com sucesso! O Robô já pode executar ordens nela.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar API');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exchangeId: string) => {
    if (!confirm(`Deseja remover as chaves de API da ${exchangeId.toUpperCase()}?`)) return;
    try {
      await deleteAutomationCredentialApi(exchangeId);
      setCredentials((prev) => {
        const copy = { ...prev };
        delete copy[exchangeId];
        return copy;
      });
      setApiKeyInput('');
      setApiSecretInput('');
      setPassphraseInput('');
    } catch (e: any) {
      alert(e.message || 'Erro ao remover API');
    }
  };

  const handleApplyDemoCredentials = async () => {
    setIsSaving(true);
    try {
      // Setup demo / sandbox keys for top exchanges so the user can see everything working immediately
      const demoExchanges = ['binance', 'bitget', 'kucoin', 'okx', 'gate'];
      for (const ex of demoExchanges) {
        const saved = await saveAutomationCredentialApi({
          exchange: ex,
          apiKey: `live_key_${ex}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          apiSecret: `secret_${Math.random().toString(36).substring(2, 18)}`,
          passphrase: ['okx', 'kucoin', 'bitget'].includes(ex) ? 'ArbitrX_Secure_2026' : undefined,
        });
        setCredentials((prev) => ({ ...prev, [ex]: saved }));
      }
      setSuccessMessage('Chaves de demonstração ativadas para 5 corretoras! Você já pode ligar o Piloto Automático.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao preencher dados de demonstração');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header Strip */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Central de APIs das Corretoras
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  {connectedCount} de 8 Conectadas
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Insira as chaves de API para o sistema executar a arbitragem 100% sozinho (Comprar ➔ Transferir ➔ Vender).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Security & Action Banner */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-slate-300">
              <strong>Segurança Máxima:</strong> Apenas permissões de <strong>Leitura &amp; Spot Trading</strong> são necessárias. <u>Nunca</u> ative saques externos.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleApplyDemoCredentials}
              disabled={isSaving}
              className="text-[11px] text-purple-300 hover:text-purple-200 underline flex items-center gap-1 font-semibold"
              title="Preenche credenciais de teste para testar imediatamente o robô"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Usar Chaves de Demonstração</span>
            </button>
          </div>
        </div>

        {/* Success Alert if any */}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Split Layout: Left = Exchanges List, Right = API Keys Form & Instructions */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Left Column (4 cols): List of 8 Exchanges */}
          <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/60 p-3 space-y-2 overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Selecione a Corretora:
            </div>

            {EXCHANGES_META.map((ex) => {
              const cred = credentials[ex.id];
              const isExConnected = !!cred && cred.isActive;
              const isSelected = selectedExchangeId === ex.id;

              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExchangeId(ex.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{ex.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{ex.name}</span>
                        {isExConnected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {isExConnected ? (
                          <span className="text-emerald-400 font-mono font-semibold">
                            Conectada (~${cred.balanceUsdt?.toLocaleString()} USDT)
                          </span>
                        ) : (
                          <span>{ex.badge}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isExConnected ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        OK
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        Pendente
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column (8 cols): Form & Guide */}
          <div className="md:col-span-8 p-4 sm:p-6 space-y-5 overflow-y-auto">
            {/* Active Exchange Title Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentMeta.icon}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{currentMeta.name}</span>
                    {isConnected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Ativa &amp; Pronta para Negociação
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Chaves Não Configuradas
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Insira a API Key e Secret gerados na sua conta da {currentMeta.name}.
                  </p>
                </div>
              </div>

              {/* Tab Selector: Formulario vs Tutorial */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('configure')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    activeTab === 'configure'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Configurar Chaves
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                    activeTab === 'guide'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Tutorial Passo a Passo</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FORMULÁRIO DE API */}
            {activeTab === 'configure' && (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Field 1: API Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    API Key da {currentMeta.name} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={`Cole aqui sua API Key (ex: bk_${currentMeta.id.slice(0, 3)}_789...)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>

                {/* Field 2: API Secret */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      API Secret da {currentMeta.name} <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecret ? 'Ocultar' : 'Mostrar'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={apiSecretInput}
                    onChange={(e) => setApiSecretInput(e.target.value)}
                    placeholder="Cole aqui seu API Secret"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>

                {/* Field 3: Passphrase (se aplicável) */}
                {currentMeta.requiresPassphrase && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Passphrase da API <span className="text-rose-400">*</span>
                      <span className="text-[10px] text-purple-300 font-normal ml-2">
                        (Obrigatório na {currentMeta.name} para autenticação V5)
                      </span>
                    </label>
                    <input
                      type="password"
                      required
                      value={passphraseInput}
                      onChange={(e) => setPassphraseInput(e.target.value)}
                      placeholder="Senha/Passphrase que você digitou ao criar a API"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500 shadow-inner"
                    />
                  </div>
                )}

                {/* Security Reminder Box */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Como o Robô opera de forma segura:</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1. Ao identificar um bilhete 100% aprovado, o robô envia ordem de compra a mercado (Ask) na Corretora 1.<br />
                    2. Ele solicita a transferência via blockchain na rede ativa confirmada.<br />
                    3. Assim que o depósito confirma na Corretora 2, a ordem de venda a mercado (Bid) é disparada.<br />
                    4. Todas as taxas já foram descontadas antecipadamente para garantir lucro final líquido.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div>
                    {isConnected && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedExchangeId)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1 px-2 rounded hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desconectar esta API</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                    >
                      Fechar
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-black text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 active:translate-y-px"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validando API...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Salvar Chaves da {currentMeta.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: TUTORIAL PASSO A PASSO */}
            {activeTab === 'guide' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Passo a Passo Oficial para {currentMeta.name}:
                    </span>
                    <a
                      href={currentMeta.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>Abrir Painel de API da {currentMeta.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-2">
                    {currentMeta.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Importante: Endereço IP / Restrição de IP</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Se a corretora solicitar restrição de IP, você pode selecionar "Irrestrito (Unrestricted)" ou inserir o IP do seu servidor ArbitrX. Para sua segurança máxima, nunca conceda permissão de saque bancário ou saque cripto externo para endereços desconhecidos.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('configure')}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <span>Já gerei as chaves, ir para o formulário</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Quick Link to Open Autonomous Bot */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {connectedCount > 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{connectedCount} corretoras prontas para arbitragem automática 3-passos</span>
              </span>
            ) : (
              <span>Insira ao menos 2 corretoras para o robô executar arbitragem cruzada</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onOpenBot && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBot();
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-slate-950 fill-current" />
                <span>Abrir Robô &amp; Ativar Piloto Automático 100%</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
