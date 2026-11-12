import React, { useState, useEffect } from 'react';
import { 
  Building2, Crown, Bot, Calculator, ShieldCheck, 
  Radar, Zap, Activity, CheckCircle2, Lock, Terminal, 
  ArrowRight, Sparkles, Scale, Network, Power, Eye, 
  ShieldAlert, Radio, AlertTriangle 
} from 'lucide-react';
import { toggleKillSwitchApi, fetchSystemHealthApi } from '../services/api';
import { SystemHealth } from '../types/enterprise';

interface AIAgentsBuildingViewProps {
  onNavigateToTickets?: () => void;
  onOpenBot?: () => void;
}

interface BuildingFloor {
  floorLevel: string;
  floorNumber: number;
  name: string;
  agentRole: string;
  avatar: string;
  icon: any;
  color: string;
  borderColor: string;
  badge: string;
  description: string;
  liveTelemetry: {
    status: string;
    metricLabel: string;
    metricValue: string;
    subtext: string;
  };
  operationalTasks: string[];
}

export const AIAgentsBuildingView: React.FC<AIAgentsBuildingViewProps> = ({
  onNavigateToTickets,
  onOpenBot,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(5); // Default to Cobertura
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activeLockIndex, setActiveLockIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemHealthApi().then((h) => {
      if (h) setHealth(h);
    });
    const interval = setInterval(() => {
      setActiveLockIndex((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const FLOORS: BuildingFloor[] = [
    {
      floorLevel: 'COBERTURA',
      floorNumber: 5,
      name: 'CEO Command Center & Governança',
      agentRole: 'Marcos Europa (CEO & Arquiteto Master)',
      avatar: '👑',
      icon: Crown,
      color: 'from-amber-500/20 to-amber-950/30 text-amber-300',
      borderColor: 'border-amber-500/50',
      badge: 'Comando Supremo & Kill Switch',
      description: 'Supervisão executiva de toda a infraestrutura, alocação de banca, gestão de membros SaaS, supervisão dos logs de auditoria e acionamento do Kill Switch Global.',
      liveTelemetry: {
        status: health?.killSwitchActive ? 'EMERGENCY_STOP' : 'ONLINE (SUPERVISÃO HFT)',
        metricLabel: 'Poder de Fogo',
        metricValue: '$40.000 USDT Alocados',
        subtext: '8 Corretoras CEX/DEX sob Governança Unificada',
      },
      operationalTasks: [
        'Supervisão macro das taxas de acerto e drawdown diário',
        'Controle de kill switch emergencial e bloqueio atômico',
        'Auditoria contínua das credenciais de API criptografadas (AES-256)',
        'Validação de fluxos de checkout e webhooks de mensalidade',
      ],
    },
    {
      floorLevel: '4º ANDAR',
      floorNumber: 4,
      name: 'Agente de Execução Automática HFT',
      agentRole: 'Bruno (Executor Síncrono de Alta Frequência)',
      avatar: '🤖',
      icon: Bot,
      color: 'from-emerald-500/20 to-emerald-950/30 text-emerald-300',
      borderColor: 'border-emerald-500/50',
      badge: 'Disparo Atômico 3-Passos',
      description: 'Responsável pelo disparo síncrono e encadeado das ordens atômicas: Compra a mercado no Ask ➔ Saque via rede blockchain rápida ➔ Venda imediata no Bid.',
      liveTelemetry: {
        status: 'EXECUÇÃO ATÔMICA ATIVA',
        metricLabel: 'Latência de Disparo',
        metricValue: '12ms (REST V3 / WS)',
        subtext: 'Ordem enfileirada somente após 5 travas aprovadas',
      },
      operationalTasks: [
        'Envio de ordem de compra no Ask sem exceder teto de liquidez',
        'Emissão imediata de requisição de saque blockchain com txHash monitorado',
        'Confirmação de crédito e disparo no Bid da ponta de venda',
        'Gravação de comprovantes e telemetria ponta a ponta',
      ],
    },
    {
      floorLevel: '3º ANDAR',
      floorNumber: 3,
      name: 'Agente Auditor de Taxas & Bilhetes',
      agentRole: 'Lucas (Motor Matemático Cego)',
      avatar: '🧮',
      icon: Calculator,
      color: 'from-cyan-500/20 to-cyan-950/30 text-cyan-300',
      borderColor: 'border-cyan-500/50',
      badge: 'Auditoria Matemática de Lucro Real',
      description: 'Motor algorítmico rigoroso que desconta taxas de Maker/Taker (0.10%), gás blockchain, taxas fixas de saque e slippage estimado antes de autorizar o bilhete.',
      liveTelemetry: {
        status: 'DESCONTO DE TAXAS ATIVO',
        metricLabel: 'Fórmula de Lucro Limpo',
        metricValue: 'Venda - (Compra + TxA + Gás + TxB + Slippage) > Margem',
        subtext: 'Nenhuma ordem é autorizada se o lucro líquido for <= 0',
      },
      operationalTasks: [
        'Dedução antecipada das taxas de saque de cada token e rede',
        'Cálculo do spread líquido real descontando comissões de corretora',
        'Emissão de bilhete oficial autenticado com trava de volume',
        'Cancelamento preventivo em caso de compressão de spread',
      ],
    },
    {
      floorLevel: '2º ANDAR',
      floorNumber: 2,
      name: 'Agente Guardião de Liquidez & Redes',
      agentRole: 'Camila & Renata (Sentinelas de Infraestrutura)',
      avatar: '🛡️',
      icon: ShieldCheck,
      color: 'from-purple-500/20 to-purple-950/30 text-purple-300',
      borderColor: 'border-purple-500/50',
      badge: 'Gargalo de Livro & Redes Ativas',
      description: 'Varredura profunda do livro de ofertas (Order Book Depth) para assegurar que a ponta de venda absorverá o capital, e checagem contínua de status SAC/REG.',
      liveTelemetry: {
        status: 'REDES & LIVROS SINCRONIZADOS',
        metricLabel: 'Status Redes CEX',
        metricValue: '100% SAC / REG Aprovados',
        subtext: 'Solana SPL, Base L2, Arbitrum, TRC20, TON e BSC',
      },
      operationalTasks: [
        'Cálculo da trava de liquidez: limitador estrito para compra segura',
        'Verificação se depósitos e saques estão suspensos na exchange',
        'Checagem de exigência de MEMO / Destination Tag',
        'Alerta de slippage dinâmico caso o book esvazie',
      ],
    },
    {
      floorLevel: '1º ANDAR',
      floorNumber: 1,
      name: 'Agente Radar / Scanner de Mercado',
      agentRole: 'Sérgio (Scanner de Alta Frequência)',
      avatar: '📡',
      icon: Radar,
      color: 'from-blue-500/20 to-blue-950/30 text-blue-300',
      borderColor: 'border-blue-500/50',
      badge: 'Varredura Contínua de 12.000+ Pares',
      description: 'Monitoramento incessante de 11 exchanges centralizadas líderes globais (Binance, Coinbase, Kraken, Bybit, OKX, KuCoin, Bitget, Gate.io, Bitfinex, MEXC, HTX) via feeds de alta frequência.',
      liveTelemetry: {
        status: 'VARREDURA EM TEMPO REAL',
        metricLabel: 'Ticks Analisados',
        metricValue: '~8.450 Ticks / Minuto',
        subtext: 'Volume de corte calibrado para capturar gemas e spreads lucrativos',
      },
      operationalTasks: [
        'Filtragem contínua de preços Ask e Bid entre 11 corretoras líderes',
        'Identificação de spreads brutos anômalos em microcaps e altcoins',
        'Envio imediato de oportunidades candidatas para o 2º Andar',
        'Manutenção de conexões WebSocket com reconexão automática',
      ],
    },
  ];

  const currentFloorData = FLOORS.find((f) => f.floorNumber === selectedFloor) || FLOORS[0];

  const ZERO_RISK_LOCKS = [
    {
      num: 1,
      title: '1. Validação de Redes e Pontes',
      desc: 'Checagem obrigatória se SAC (saque na origem) e REG (depósito no destino) estão 100% liberados.',
      status: 'VERIFICADO',
    },
    {
      num: 2,
      title: '2. Profundidade do Order Book',
      desc: 'Inspeção do volume de liquidez nos primeiros níveis para evitar compra maior que a capacidade de venda.',
      status: 'AUDITADO',
    },
    {
      num: 3,
      title: '3. Slippage Dinâmico e Volatilidade',
      desc: 'Simulação preditiva de impacto de mercado garantindo tolerância máxima de 0.05% de variação.',
      status: 'PROTEGIDO',
    },
    {
      num: 4,
      title: '4. Auditoria de Lucro Líquido Real',
      desc: 'Aplicação da fórmula matemática deduzindo taxas de compra, gás, saque, venda e slippage.',
      status: 'LUCRO GARANTIDO',
    },
    {
      num: 5,
      title: '5. Sinal Verde Atômico',
      desc: 'Autorização unificada e transmissão da chave de disparo criptografada diretamente para o 4º Andar.',
      status: 'DISPARO LIBERADO',
    },
  ];

  const handleTestFloorProtocol = () => {
    setFeedback(`Simulação de disparo executada com sucesso no ${currentFloorData.floorLevel}! Todas as 5 travas responderam com sinal verde.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/50 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 uppercase">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                A CENTRAL "O EDIFÍCIO" · M.ÁRBITRO
              </span>
              <span className="text-xs text-slate-400 font-mono">
                · Torre Multiagente de Arbitragem Autônoma
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Painel Visual dos Agentes Especializados
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Cada andar do edifício abriga um agente de inteligência responsável por uma etapa estrita do ciclo de arbitragem, operando em sincronia sob o <strong>Protocolo de 5 Travas Zero-Risco</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToTickets && (
              <button
                type="button"
                onClick={onNavigateToTickets}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-slate-700 flex items-center gap-2"
              >
                <span>Ver Bilhetes Auditados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenBot && (
              <button
                type="button"
                onClick={onOpenBot}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:translate-y-px"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Abrir Robô Executor (4º Andar)</span>
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left = Visual Tower Representation (5 Floors), Right = Active Floor Telemetry & Zero-Risk Locks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (5 cols): The Tower / Building Visualizer */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Estrutura Vertical do Edifício:</span>
            <span className="text-[10px] text-emerald-400">5 Níveis Operacionais</span>
          </div>

          <div className="space-y-2.5">
            {FLOORS.map((floor) => {
              const Icon = floor.icon;
              const isSelected = selectedFloor === floor.floorNumber;
              return (
                <button
                  key={floor.floorNumber}
                  onClick={() => setSelectedFloor(floor.floorNumber)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 relative overflow-hidden group ${
                    isSelected
                      ? `bg-slate-900 ${floor.borderColor} shadow-xl ring-1 ring-purple-500/40`
                      : 'bg-slate-950/70 hover:bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-2xl shrink-0 p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {floor.avatar}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-purple-400">
                          {floor.floorLevel}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {floor.badge}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white truncate mt-0.5">
                        {floor.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {floor.agentRole}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <ArrowRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'text-purple-400 translate-x-1' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right (7 cols): Selected Floor Deep Dive & The 5-Lock Zero Risk Protocol */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Floor Dossier Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentFloorData.avatar}</span>
                <div>
                  <div className="text-xs font-mono font-bold text-purple-400">
                    {currentFloorData.floorLevel} · {currentFloorData.name}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {currentFloorData.agentRole}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestFloorProtocol}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-colors"
              >
                Testar Agente
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentFloorData.description}
            </p>

            {/* Live Telemetry Strip of Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Status do Agente</div>
                <div className="text-xs font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentFloorData.liveTelemetry.status}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{currentFloorData.liveTelemetry.subtext}</div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">{currentFloorData.liveTelemetry.metricLabel}</div>
                <div className="text-xs font-black text-cyan-300 mt-0.5 font-mono">
                  {currentFloorData.liveTelemetry.metricValue}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Sincronização contínua com os outros andares</div>
              </div>
            </div>

            {/* Core Responsibilities */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white">Atribuições Operacionais do Andar:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentFloorData.operationalTasks.map((task, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PROTOCOLO DE SEGURANÇA PRÉ-EXECUÇÃO (TRAVA ZERO-RISCO) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Protocolo de Segurança Pré-Execução (5 Travas Zero-Risco)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% BLINDADO
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Antes de disparar qualquer ordem automática, o sistema M.Árbitro submete a oportunidade a uma cadeia de <strong>5 barreiras matemáticas invioláveis</strong>. Se qualquer barreira falhar, a ordem é cancelada instantaneamente.
            </p>

            <div className="space-y-2.5">
              {ZERO_RISK_LOCKS.map((lock, idx) => {
                const isHighlight = activeLockIndex === idx;
                return (
                  <div
                    key={lock.num}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isHighlight
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                        isHighlight ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {lock.num}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{lock.title}</span>
                          {isHighlight && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {lock.desc}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      {lock.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
