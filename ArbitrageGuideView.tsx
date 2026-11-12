import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, Zap, HelpCircle, DollarSign, RefreshCw } from 'lucide-react';

export const ArbitrageGuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Manual de Arbitragem Cripto Sem Erro &amp; Checklist de Execução
        </h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Arbitragem cripto é a prática de comprar um ativo em uma corretora por um preço menor e vendê-lo simultaneamente em outra por um preço maior. No entanto, o lucro real depende exclusivamente da <strong>taxa de saque da rede</strong>, da <strong>disponibilidade operacional de depósito e saque</strong> e da <strong>profundidade de liquidez no livro de ofertas</strong>.
        </p>
      </div>

      {/* The 5 Golden Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-xs">
              01
            </span>
            <span>A Mesma Rede Deve Estar Aberta em Ambas as Corretoras</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nunca compre uma moeda sem antes verificar se a carteira de depósito da corretora de destino está com status <strong>OPERACIONAL</strong>. Se o depósito estiver suspenso para manutenção, suas moedas ficarão travadas até que a exchange libere a rede.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-xs">
              02
            </span>
            <span>Atenção Crítica ao Tag / Memo (XRP, TON, TIA, EOS)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Corretoras usam um único endereço master para todas as contas nessas redes. O <strong>Destination Tag</strong> ou <strong>Memo</strong> é o que identifica a sua conta. Se você esquecer o Tag, seus fundos não cairão e exigirão semanas de suporte da exchange para resgate.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-xs">
              03
            </span>
            <span>Considere o Slippage no Livro de Ofertas</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O preço de topo de livro (melhor ask) pode ter apenas $50 de volume disponível. Se você enviar uma ordem a mercado de $2.000, consumirá vários níveis do livro e pagará um preço médio muito mais alto (slippage), reduzindo ou zerando seu spread.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-xs">
              04
            </span>
            <span>A Taxa de Saque Deve Ser Menor que o Lucro Bruto</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Em redes como Bitcoin Mainnet ou Ethereum ERC20, as taxas de saque podem variar de $3 a $15. Se o seu lucro bruto em um spread de 1% sobre $500 for de $5, uma taxa de $6 causará prejuízo líquido de $1. Sempre prefira redes L2 (Arbitrum, BSC, Solana, Tron).
          </p>
        </div>
      </div>

      {/* Advanced Strategy: Closed Loop Arbitrage */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/60 border border-emerald-800/40 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Estratégia Avançada: Arbitragem Simultânea com Saldo Pré-Alocado (Zero Risco Cambial)
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          A maior causa de perdas em arbitragem tradicional é a <strong>variação do preço do ativo enquanto você espera a confirmação da transferência na blockchain</strong> (que pode levar de 2 a 30 minutos).
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-3">
          <div className="font-semibold text-emerald-400">Como os traders profissionais operam:</div>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Mantenha saldo dividido entre as duas exchanges (exemplo: $2.500 USDT na Binance e $2.500 USDT na Bybit + uma quantidade do token em ambas).
            </li>
            <li>
              Quando o scanner apontar que a SOL está 1.8% mais barata na Binance do que na Bybit:
            </li>
            <li>
              Você clica em <strong>comprar na Binance</strong> com USDT e <strong>vende simultaneamente na Bybit</strong> a SOL que já estava na sua conta lá.
            </li>
            <li>
              <strong>Resultado instantâneo:</strong> Lucro travado no mesmo segundo, com zero risco de o preço despencar durante o envio na blockchain!
            </li>
            <li>
              Depois, no momento oportuno, você transfere os fundos com calma pela rede mais barata para rebalancear suas contas.
            </li>
          </ol>
        </div>
      </div>

      {/* Pre-Flight Execution Checklist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Checklist Pré-Execução (Confira antes de cada ordem)
        </h3>

        <div className="space-y-2 text-xs">
          {[
            'O spread líquido real mostrado no scanner está positivo (> 0.5%) após deduzir taxas de taker e saque?',
            'O livro de ofertas da exchange de venda possui profundidade suficiente para absorver seu volume sem derreter o preço?',
            'A rede escolhida (ex: BEP20, TRC20, Arbitrum, Solana) é a MESMA selecionada na tela de saque e de depósito?',
            'O status de depósito na exchange de destino está OPERACIONAL (sem aviso de manutenção de carteira)?',
            'Se a moeda for XRP, TON, TIA ou EOS, o Destination Tag / Memo foi copiado e colado exatamente sem espaços?',
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <span className="font-mono text-emerald-400 font-bold shrink-0">[{index + 1}]</span>
              <span className="text-slate-300 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
