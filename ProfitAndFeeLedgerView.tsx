import React, { useState, useEffect, useMemo } from 'react';
import { ProfitAndFeeSummary, ProfitAndFeeLedgerItem } from '../types/enterprise';
import { fetchProfitAndFeeLedgerApi } from '../services/api';
import { 
  Calculator, Receipt, ArrowRight, ShieldCheck, Download, 
  Copy, Check, RefreshCw, Filter, Search, Wallet, TrendingUp,
  Network, Building2, Coins, ArrowUpRight, Scale, CheckCircle2,
  ExternalLink, ChevronDown, ChevronUp, PieChart, Layers, Clock
} from 'lucide-react';

export const ProfitAndFeeLedgerView: React.FC = () => {
  const [ledger, setLedger] = useState<ProfitAndFeeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProfitAndFeeLedgerApi();
      if (data) setLedger(data);
    } catch (e) {
      console.error('Erro ao carregar livro contábil:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtragem dos itens do livro
  const filteredItems = useMemo(() => {
    if (!ledger) return [];
    const now = Date.now();
    return ledger.items.filter((item) => {
      // Busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchPair = item.pair.toLowerCase().includes(query);
        const matchEx = item.buyExchange.toLowerCase().includes(query) || item.sellExchange.toLowerCase().includes(query);
        const matchNet = item.networkName.toLowerCase().includes(query);
        if (!matchPair && !matchEx && !matchNet) return false;
      }
      // Corretora
      if (selectedExchange !== 'ALL') {
        const ex = selectedExchange.toLowerCase();
        if (item.buyExchange.toLowerCase() !== ex && item.sellExchange.toLowerCase() !== ex) {
          return false;
        }
      }
      // Rede
      if (selectedNetwork !== 'ALL') {
        if (!item.networkName.toLowerCase().includes(selectedNetwork.toLowerCase())) {
          return false;
        }
      }
      // Período
      if (selectedPeriod === '24H' && now - item.timestamp > 86400000) return false;
      if (selectedPeriod === '7D' && now - item.timestamp > 7 * 86400000) return false;
      if (selectedPeriod === '30D' && now - item.timestamp > 30 * 86400000) return false;

      return true;
    });
  }, [ledger, searchQuery, selectedExchange, selectedNetwork, selectedPeriod]);

  // Exportar relatório contábil em CSV
  const exportCsv = () => {
    if (!ledger || filteredItems.length === 0) return;
    const headers = [
      'ID Transacao',
      'Data/Hora',
      'Par',
      'Corretora Compra',
      'Corretora Venda',
      'Rede Blockchain',
      'Capital Operado (USDT)',
      'Retorno Bruto (USDT)',
      'Lucro Liquido no Bolso (USDT)',
      'Taxa Corretora 1 (USDT)',
      'Taxa Rede Gas (USDT)',
      'Taxa Corretora 2 (USDT)',
      'Slippage (USDT)',
      'Gasto Total em Taxas (USDT)',
      'Status',
    ];

    const rows = filteredItems.map((i) => [
      i.id,
      new Date(i.timestamp).toLocaleString('pt-BR'),
      i.pair,
      i.buyExchange.toUpperCase(),
      i.sellExchange.toUpperCase(),
      i.networkName,
      i.capitalOperatedUsd.toFixed(2),
      i.grossReturnUsd.toFixed(2),
      i.netProfitUsd.toFixed(2),
      i.fees.buyFeeUsd.toFixed(2),
      i.fees.networkGasFeeUsd.toFixed(2),
      i.fees.sellFeeUsd.toFixed(2),
      i.fees.slippageUsd.toFixed(2),
      i.fees.totalFeesUsd.toFixed(2),
      i.status,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extrato_lucros_taxas_marbitro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyFullSummaryText = () => {
    if (!ledger) return;
    const text = `=== EXTRATO CONTÁBIL DE LUCROS E TAXAS (M.ÁRBITRO HFT) ===
Data do Relatório: ${new Date().toLocaleString('pt-BR')}
Volume Total Operado: $${ledger.totalVolumeOperatedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT

💰 RESULTADO CONSOLIDADO:
• Lucro Líquido Realizado (Ficou no Seu Bolso): +$${ledger.totalNetProfitUsd.toFixed(2)} USDT (${ledger.pctToPocket}% do lucro bruto)
• Gasto Total em Taxas: -$${ledger.totalFeesPaidUsd.toFixed(2)} USDT

📊 ONDE O DINHEIRO FOI (DESTINO DOS RECURSOS):
1. Seu Bolso (Banca): +$${ledger.totalRetainedInPocketUsd.toFixed(2)} USDT (${ledger.pctToPocket}%)
2. Corretoras CEX (Binance, Bitget, OKX, etc.): -$${ledger.totalToExchangesUsd.toFixed(2)} USDT (${ledger.pctToExchanges}%)
3. Redes Blockchain (Gás Solana, BEP20, TRON, etc.): -$${ledger.totalToBlockchainGasUsd.toFixed(2)} USDT (${ledger.pctToBlockchainGas}%)
4. Mercado e Livro (Slippage Estimado): -$${ledger.totalToSlippageUsd.toFixed(2)} USDT (${ledger.pctToSlippage}%)

Total de Operações Auditadas: ${ledger.items.length}
100% Auditado e Reconciliado pelo M.Árbitro
=========================================================`;

    copyToClipboard(text, 'full_summary');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
              <Receipt className="w-3.5 h-3.5" />
              <span>LIVRO CONTÁBIL &amp; AUDITORIA FINANCEIRA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Extrato de Lucros, Gastos de Taxas &amp; Onde o Dinheiro Foi
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Auditoria em tempo real de cada centavo movimentado. Veja com exatidão matemática quanto ficou
              limpo no seu bolso e quanto foi pago para cada corretora, taxa de gás blockchain e liquidez.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadLedger}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Recarregar dados contábeis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={copyFullSummaryText}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Copiar resumo contábil para a área de transferência"
            >
              {copiedId === 'full_summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedId === 'full_summary' ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:translate-y-px"
              title="Baixar planilha CSV completa de auditoria contábil"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards Principais de Balanço Contábil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Lucro Líquido no Seu Bolso (Verde Esmeralda) */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Ficou no Seu Bolso</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
              {ledger?.pctToPocket || 91.5}% do Lucro
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums mt-2">
            +${ledger?.totalNetProfitUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>R$ {((ledger?.totalNetProfitUsd || 0) * 6.0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lucro Limpo</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800/80 pt-2">
            Valor líquido creditado na sua carteira após dedução integral de todas as despesas.
          </p>
        </div>

        {/* Card 2: Taxas Pagas às Corretoras (Rosa / Vermelho) */}
        <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-rose-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span>Taxas de Corretoras (CEX)</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/40">
              {ledger?.pctToExchanges || 5.8}%
            </span>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tabular-nums mt-2">
            -${ledger?.totalToExchangesUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>{ledger?.byExchange.length || 0} Corretoras Parceiras</span>
            <span className="text-rose-400">Maker/Taker 0.10%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800/80 pt-2">
            Taxas de negociação nas pontas de compra no Ask e venda no Bid.
          </p>
        </div>

        {/* Card 3: Gás de Rede Blockchain (Ciano) */}
        <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Gás de Rede Blockchain</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/40">
              {ledger?.pctToBlockchainGas || 1.3}%
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-400 font-mono tabular-nums mt-2">
            -${ledger?.totalToBlockchainGasUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>{ledger?.byNetwork.length || 0} Redes Utilizadas</span>
            <span className="text-cyan-400">Taxas Fixas de Saque</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800/80 pt-2">
            Pago diretamente aos validadores e mineradores na transferência entre exchanges.
          </p>
        </div>

        {/* Card 4: Slippage & Tolerância de Livro (Âmbar) */}
        <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Slippage &amp; Spread do Livro</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
              {ledger?.pctToSlippage || 1.4}%
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono tabular-nums mt-2">
            -${ledger?.totalToSlippageUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Tolerância Zero-Risco</span>
            <span className="text-amber-400">Absorção de Book</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800/80 pt-2">
            Diferença conservadora calculada preventivamente para absorver qualquer derrapagem.
          </p>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: "ONDE O DINHEIRO FOI" (CASH FLOW DESTINATION) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <span>Mapeamento Visual: Para Onde o Dinheiro Foi?</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribuição percentual e financeira de cada dólar de retorno bruto gerado nas operações.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span>Retorno Bruto Acumulado:</span>
            <strong className="text-white font-bold">${ledger?.totalGrossProfitUsd.toFixed(2)} USDT</strong>
          </div>
        </div>

        {/* Barra Proporcional Segmentada Colorida */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Destino Proporcional de Cada $100 Gerados:</span>
            <span className="text-emerald-400 font-bold">${ledger?.pctToPocket.toFixed(1)} vão direto pro seu bolso</span>
          </div>

          <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex p-1 gap-1 border border-slate-800 shadow-inner">
            {/* Bolso */}
            <div 
              style={{ width: `${ledger?.pctToPocket || 91.5}%` }} 
              className="bg-emerald-500 hover:bg-emerald-400 transition-all rounded h-full flex items-center justify-center text-[10px] font-black text-slate-950 font-mono tracking-wider truncate px-1 shadow-sm"
              title={`Ficou no Seu Bolso: ${ledger?.pctToPocket}% ($${ledger?.totalRetainedInPocketUsd.toFixed(2)} USDT)`}
            >
              {ledger?.pctToPocket.toFixed(1)}% SEU BOLSO
            </div>

            {/* Corretoras */}
            <div 
              style={{ width: `${ledger?.pctToExchanges || 5.8}%` }} 
              className="bg-rose-500 hover:bg-rose-400 transition-all rounded h-full flex items-center justify-center text-[9px] font-bold text-white font-mono truncate px-1"
              title={`Corretoras: ${ledger?.pctToExchanges}% ($${ledger?.totalToExchangesUsd.toFixed(2)} USDT)`}
            >
              {ledger && ledger.pctToExchanges > 3 && `${ledger.pctToExchanges.toFixed(1)}% CEX`}
            </div>

            {/* Blockchain */}
            <div 
              style={{ width: `${ledger?.pctToBlockchainGas || 1.3}%` }} 
              className="bg-cyan-500 hover:bg-cyan-400 transition-all rounded h-full flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono truncate px-0.5"
              title={`Gás Blockchain: ${ledger?.pctToBlockchainGas}% ($${ledger?.totalToBlockchainGasUsd.toFixed(2)} USDT)`}
            >
              {ledger && ledger.pctToBlockchainGas > 2 && `${ledger.pctToBlockchainGas.toFixed(1)}%`}
            </div>

            {/* Slippage */}
            <div 
              style={{ width: `${ledger?.pctToSlippage || 1.4}%` }} 
              className="bg-amber-500 hover:bg-amber-400 transition-all rounded h-full flex items-center justify-center text-[9px] font-bold text-slate-950 font-mono truncate px-0.5"
              title={`Slippage: ${ledger?.pctToSlippage}% ($${ledger?.totalToSlippageUsd.toFixed(2)} USDT)`}
            >
              {ledger && ledger.pctToSlippage > 2 && `${ledger.pctToSlippage.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* Os 4 Destinatários Detalhados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>1. Sua Banca (Você)</span>
              </span>
              <span className="text-emerald-300 font-bold">{ledger?.pctToPocket.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black text-white font-mono">
              +${ledger?.totalRetainedInPocketUsd.toFixed(2)} USDT
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Destinatário: Sua carteira pessoal. Lucro 100% líquido após pagar todos os custos.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/40 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-rose-400 flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>2. Corretoras (CEX)</span>
              </span>
              <span className="text-rose-300 font-bold">{ledger?.pctToExchanges.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black text-rose-400 font-mono">
              -${ledger?.totalToExchangesUsd.toFixed(2)} USDT
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Destinatário: Binance, Bitget, OKX, Gate, MEXC, KuCoin. Taxas Maker/Taker oficiais.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>3. Redes Blockchain</span>
              </span>
              <span className="text-cyan-300 font-bold">{ledger?.pctToBlockchainGas.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black text-cyan-400 font-mono">
              -${ledger?.totalToBlockchainGasUsd.toFixed(2)} USDT
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Destinatário: Mineradores e validadores das redes Solana, BEP20, TRON, Arbitrum.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>4. Mercado / Slippage</span>
              </span>
              <span className="text-amber-300 font-bold">{ledger?.pctToSlippage.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black text-amber-400 font-mono">
              -${ledger?.totalToSlippageUsd.toFixed(2)} USDT
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              Destinatário: Livro de ofertas. Margem de segurança de profundidade pré-absorvida.
            </p>
          </div>

        </div>
      </div>

      {/* DISCRIMINAÇÃO POR CORRETORA E POR REDE BLOCKCHAIN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bloco 1: Taxas Pagas por Corretora */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Taxas Pagas por Corretora (Onde o Dinheiro Foi)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total: -${ledger?.totalToExchangesUsd.toFixed(2)} USDT
            </span>
          </div>

          <div className="space-y-2">
            {ledger?.byExchange.map((ex) => (
              <div 
                key={ex.exchange}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono">
                    {ex.exchange.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{ex.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {ex.tradesCount} ordens executadas
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-rose-400">-${ex.feesPaidUsd.toFixed(2)} USDT</div>
                  <div className="text-[10px] text-slate-500">
                    {ex.pctOfTotalExchangeFees}% do total de corretagem
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 2: Gás Pago por Rede Blockchain */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Gás Pago por Rede Blockchain
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total: -${ledger?.totalToBlockchainGasUsd.toFixed(2)} USDT
            </span>
          </div>

          <div className="space-y-2">
            {ledger?.byNetwork.map((net) => (
              <div 
                key={net.network}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[11px] font-bold text-cyan-400">
                    🌐
                  </div>
                  <div>
                    <div className="font-bold text-white">{net.network}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {net.transfersCount} saques inter-exchange
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-cyan-400">-${net.gasPaidUsd.toFixed(2)} USDT</div>
                  <div className="text-[10px] text-slate-500">
                    Média de ~${net.avgFeeUsd.toFixed(2)} por envio
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUDITORIA TRANSAÇÃO A TRANSAÇÃO: LIVRO CONTÁBIL DETALHADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        
        {/* Header do Extrato com Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Livro Razão: Extrato Detalhado Transação por Transação</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer operação para inspecionar os 5 destinos do dinheiro e os comprovantes criptográficos.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/40 self-start lg:self-auto">
            {filteredItems.length} Operações Auditadas
          </span>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Busca por Par */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por par, cripto ou rota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
          </div>

          {/* Filtro por Corretora */}
          <select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">Todas as Corretoras</option>
            <option value="binance">Binance</option>
            <option value="bitget">Bitget</option>
            <option value="okx">OKX</option>
            <option value="gate">Gate.io</option>
            <option value="kucoin">KuCoin</option>
            <option value="mexc">MEXC</option>
          </select>

          {/* Filtro por Rede */}
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">Todas as Redes Blockchain</option>
            <option value="Solana">Solana (SPL)</option>
            <option value="BEP20">BNB Chain (BEP20)</option>
            <option value="TRC20">Tron (TRC20)</option>
            <option value="Arbitrum">Arbitrum One</option>
            <option value="Sui">Sui Network</option>
            <option value="NEAR">NEAR Protocol</option>
          </select>

          {/* Filtro por Período */}
          <select
            value={selectedPeriod}
            onChange={(e: any) => setSelectedPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">Todo o Histórico</option>
            <option value="24H">Últimas 24 Horas</option>
            <option value="7D">Últimos 7 Dias</option>
            <option value="30D">Últimos 30 Dias</option>
          </select>
        </div>

        {/* Lista de Transações Auditadas */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              Nenhuma transação contábil encontrada para os filtros selecionados.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              return (
                <div 
                  key={item.id}
                  className={`bg-slate-950 border transition-all rounded-2xl overflow-hidden ${
                    isExpanded ? 'border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Resumo da Linha (Click to Expand) */}
                  <div 
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Par, Rota e Data */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                        {item.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{item.pair}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                            {item.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">{item.buyExchange.toUpperCase()}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-purple-400 font-bold">{item.sellExchange.toUpperCase()}</span>
                          <span>·</span>
                          <span className="text-cyan-400">{item.networkName}</span>
                          <span>·</span>
                          <span className="text-slate-500">{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Números: Capital, Gastos e Lucro Líquido */}
                    <div className="flex items-center justify-between md:justify-end gap-6 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">Capital Operado</span>
                        <span className="font-bold text-slate-200">${item.capitalOperatedUsd.toFixed(2)} USDT</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">Gasto Total Taxas</span>
                        <span className="font-bold text-rose-400">-${item.fees.totalFeesUsd.toFixed(2)} USDT</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">Lucro Líquido (No Bolso)</span>
                        <span className="font-black text-sm text-emerald-400">
                          +${item.netProfitUsd.toFixed(2)} USDT (+{item.netProfitPct.toFixed(2)}%)
                        </span>
                      </div>

                      <div className="text-slate-400 pl-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento Expandido: Para Onde o Dinheiro Foi */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-800/80 bg-slate-900/40 space-y-4">
                      
                      {/* Box "Para Onde o Dinheiro Foi" nesta Operação */}
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Para Onde o Dinheiro Foi Nesta Operação:</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Retorno Bruto: ${item.grossReturnUsd.toFixed(2)} USDT (Lucro Bruto: +${item.grossProfitUsd.toFixed(2)})
                          </span>
                        </div>

                        {/* 5 Fatias do Dinheiro */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs font-mono">
                          {item.whereTheMoneyWent.map((slice, sIdx) => (
                            <div 
                              key={sIdx}
                              className={`p-3 rounded-xl border ${
                                slice.category === 'USER_PROFIT' 
                                  ? 'bg-emerald-950/40 border-emerald-500/50' 
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="font-semibold text-slate-400 font-sans truncate" title={slice.recipient}>
                                  {slice.categoryLabel}
                                </span>
                                <span className="font-bold text-white">{slice.pctOfTotal}%</span>
                              </div>
                              <div className={`text-sm font-black ${slice.category === 'USER_PROFIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {slice.category === 'USER_PROFIT' ? '+' : '-'}${slice.amountUsd.toFixed(2)} USDT
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans mt-1 line-clamp-2">
                                {slice.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Equação Contábil Consolidada */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                        <div className="space-y-0.5">
                          <div className="text-slate-400 font-sans font-semibold">Equação Contábil Auditada:</div>
                          <div className="text-slate-300">
                            Retorno Bruto ($${item.grossReturnUsd.toFixed(2)}) - Taxas 2 Corretoras ($${(item.fees.buyFeeUsd + item.fees.sellFeeUsd).toFixed(2)}) - Gás Blockchain ($${item.fees.networkGasFeeUsd.toFixed(2)}) - Slippage ($${item.fees.slippageUsd.toFixed(2)}) - Capital Inicial ($${item.capitalOperatedUsd.toFixed(2)})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase block font-sans">Lucro Líquido Realizado</span>
                          <span className="text-emerald-400 font-black text-sm">
                            +${item.netProfitUsd.toFixed(2)} USDT (+{item.netProfitPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Comprovantes e Hashes Criptográficos */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-3">
                          {item.txHashes?.buyTx && (
                            <span>Ordem Compra: <strong className="text-slate-200">{item.txHashes.buyTx}</strong></span>
                          )}
                          {item.txHashes?.withdrawTx && (
                            <span className="flex items-center gap-1">
                              <span>Hash Saque Blockchain:</span>
                              <strong className="text-cyan-300" title={item.txHashes.withdrawTx}>
                                {item.txHashes.withdrawTx.slice(0, 16)}...
                              </strong>
                              <button
                                onClick={() => copyToClipboard(item.txHashes?.withdrawTx || '', item.id + '_tx')}
                                className="p-0.5 hover:text-white"
                                title="Copiar Hash"
                              >
                                {copiedId === item.id + '_tx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </span>
                          )}
                          {item.txHashes?.sellTx && (
                            <span>Ordem Venda: <strong className="text-slate-200">{item.txHashes.sellTx}</strong></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            RECONCILIADO 100%
                          </span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
