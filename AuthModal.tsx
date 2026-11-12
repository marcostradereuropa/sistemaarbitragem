import React, { useState } from 'react';
import { UserAccount } from '../types/auth';
import { loginApi } from '../services/api';
import { 
  X, Lock, Mail, ShieldCheck, Crown, UserCheck, 
  Sparkles, AlertCircle, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, token: string) => void;
  currentUser: UserAccount | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Informe o e-mail de acesso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await loginApi(email.trim(), password.trim());
      setSuccessMessage(`Bem-vindo, ${data.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginMasterAdmin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await loginApi('marcostradereuropa@gmail.com', 'admin123');
      setSuccessMessage('Acesso Master Concedido: Marcos Europa (Administrador)');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha no login de Administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginClient = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await loginApi('cliente@arbitrx.com', 'vip123');
      setSuccessMessage('Acesso Concedido: Cliente VIP Licenciado');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha no login de Cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Controle de Acesso</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ArbitrX
                </span>
              </h2>
              <p className="text-xs text-slate-400">Entre na sua conta de Administrador ou Cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1-Click Fast Login Buttons for marcos & client */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Acesso Rápido Recomendado
            </div>
            
            {/* Marcos Master Admin Button */}
            <button
              type="button"
              onClick={handleQuickLoginMasterAdmin}
              disabled={isLoading}
              className="w-full group p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-slate-900 border border-purple-500/40 hover:border-purple-400 text-left transition-all flex items-center justify-between shadow-sm hover:shadow-purple-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Entrar como Administrador Master</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-mono">
                      Dono
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-300/80 font-mono">marcostradereuropa@gmail.com</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Client Demo Button */}
            <button
              type="button"
              onClick={handleQuickLoginClient}
              disabled={isLoading}
              className="w-full group p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Entrar como Cliente Licenciado (Demo)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      VIP Anual
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">cliente@arbitrx.com</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider shrink-0">
              Ou digite suas credenciais
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Senha / Chave de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:translate-y-px disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-800/60 text-center text-[11px] text-slate-400">
            Acesso exclusivo para administradores e clientes com licença ativa.
          </div>
        </div>
      </div>
    </div>
  );
};
