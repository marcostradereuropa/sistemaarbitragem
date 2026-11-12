import React, { useState } from 'react';
import { 
  RefreshCw, ShieldAlert, Network, BookOpen, Layers, 
  BrainCircuit, Bot, Crown, User, LogOut, Lock, Sparkles,
  Key, Compass, Power, Menu, X, ChevronDown, Receipt
} from 'lucide-react';
import { UserAccount } from '../types/auth';

interface NavbarProps {
  activeTab: 'scanner' | 'dashboard' | 'agents' | 'automation' | 'admin' | 'networks' | 'calculator' | 'guide' | 'ledger';
  setActiveTab: (tab: 'scanner' | 'dashboard' | 'agents' | 'automation' | 'admin' | 'networks' | 'calculator' | 'guide' | 'ledger') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (sec: number) => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenApiVault: () => void;
  killSwitchActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  autoRefreshInterval,
  setAutoRefreshInterval,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenApiVault,
  killSwitchActive,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard 6 Setores', icon: Compass, badge: 'Enterprise' },
    { id: 'scanner' as const, label: 'Scanner & Bilhetes', icon: Layers },
    { id: 'ledger' as const, label: 'Extrato de Lucros & Taxas', icon: Receipt, badge: 'Onde Foi o $' },
    { id: 'agents' as const, label: 'O Edifício (IA)', icon: BrainCircuit, badge: '5 Andares' },
    { id: 'automation' as const, label: 'Bot 100% Automático', icon: Bot, badge: 'HFT' },
    { id: 'admin' as const, label: 'Painel do CEO', icon: Crown, badge: isAdmin ? 'Master' : undefined },
    { id: 'networks' as const, label: 'Redes & Taxas', icon: Network },
    { id: 'calculator' as const, label: 'Simulador', icon: BookOpen },
    { id: 'guide' as const, label: 'Guia Zero-Risco', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          
          {/* Zone 1: Wordmark Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Menu de Navegação"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-sm tracking-wider shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                MÁ
              </div>
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>M.Árbitro</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                    HFT 4.8
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono hidden sm:block leading-none mt-0.5">
                  Arbitragem Multidimensional
                </div>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-4 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap transition-all flex items-center gap-1.5 py-1 px-2 rounded-lg ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 font-bold border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (API Keys, Kill Switch Alert, Refresh, Auth) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Kill Switch Indicator if active */}
            {killSwitchActive && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs font-black animate-pulse">
                <Power className="w-3.5 h-3.5 text-rose-400" />
                <span>KILL SWITCH ATIVO</span>
              </span>
            )}

            {/* DIRECT API KEYS VAULT BUTTON (Prominent on all screens) */}
            <button
              onClick={onOpenApiVault}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:scale-102 active:translate-y-px"
              title="Configurar chaves de API das 8 corretoras"
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">APIs Corretoras</span>
              <span className="sm:hidden">APIs</span>
            </button>

            {/* Scan Market button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-950 bg-emerald-400 rounded-xl hover:bg-emerald-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 active:translate-y-px"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isRefreshing ? 'Auditando...' : 'Escanear'}</span>
            </button>

            {/* User Profile / Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 sm:px-2.5 sm:py-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {isAdmin ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-[11px] font-bold text-white leading-none">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                    {isAdmin ? 'CEO Master' : currentUser.plan}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:text-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown when open */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-xs truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
