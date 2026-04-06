import React, { useEffect, useMemo, useState } from 'react';
import { dataService } from '../services/dataService';
import { FileText, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function Relatorios() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'mes' | 'trimestre' | 'semestre' | 'ano'>('mes');

  const getPeriodoDatas = () => {
    const now = new Date();
    switch (periodoSelecionado) {
      case 'mes':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'trimestre':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'semestre':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'ano':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
    }
  };

  const { start, end } = getPeriodoDatas();
  const kpis = useMemo(() => dataService.getKPIs(undefined, start, end), [start, end]);
  const despesasPorCategoria = useMemo(() => dataService.getDespesasPorCategoria(undefined, start, end), [start, end]);
  const receitasPorPlano = useMemo(() => dataService.getReceitasPorPlano(undefined, start, end), [start, end]);
  const alunos = useMemo(() => dataService.getAlunos(), []);

  const periodoLabel = useMemo(() => {
    const labels = {
      mes: 'Mes',
      trimestre: 'Trimestre',
      semestre: 'Semestre',
      ano: 'Ano',
    } as const;
    return labels[periodoSelecionado];
  }, [periodoSelecionado]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Cálculos adicionais
  const custoMedioAluno = kpis.totalAlunos > 0 ? kpis.despesaTotal / kpis.totalAlunos : 0;
  const roiMarketing = useMemo(() => {
    const gastoMarketing = despesasPorCategoria.find(d => d.categoria === 'marketing')?.valor || 0;
    return gastoMarketing > 0 ? ((kpis.receitaTotal - gastoMarketing) / gastoMarketing) * 100 : 0;
  }, [despesasPorCategoria, kpis]);

  const margemPorPlano = useMemo(() => {
    const planoValores = { mensal: 100, trimestral: 270, anual: 960 };
    return Object.entries(planoValores).map(([plano, valor]) => {
      const receita = receitasPorPlano.find(r => r.plano === plano)?.valor || 0;
      const alunosPlano = alunos.filter(a => a.plano === plano && a.status === 'ativo').length;
      const custoEstimado = alunosPlano * custoMedioAluno;
      const lucro = receita - custoEstimado;
      const margem = receita > 0 ? (lucro / receita) * 100 : 0;

      return {
        plano: plano.charAt(0).toUpperCase() + plano.slice(1),
        receita,
        custo: custoEstimado,
        lucro,
        margem,
      };
    });
  }, [receitasPorPlano, alunos, custoMedioAluno]);

  const categoriaNomes: Record<string, string> = {
    aluguel: 'Aluguel',
    salarios: 'Salários',
    equipamentos: 'Equipamentos',
    marketing: 'Marketing',
    luz: 'Energia',
    agua: 'Água',
    manutencao: 'Manutenção',
    outros: 'Outros',
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsv = (value: string | number) => {
    const text = String(value ?? '');
    if (text.includes(';') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const handleExportarExcel = () => {
    const rows: string[] = [];
    rows.push(`Relatorio Financeiro;GymFinancas`);
    rows.push(`Periodo;${escapeCsv(periodoLabel)}`);
    rows.push(`Data de geracao;${escapeCsv(format(new Date(), 'dd/MM/yyyy HH:mm'))}`);
    rows.push('');

    rows.push('Resumo;Valor');
    rows.push(`Receita Total;${kpis.receitaTotal.toFixed(2)}`);
    rows.push(`Despesa Total;${kpis.despesaTotal.toFixed(2)}`);
    rows.push(`Lucro Liquido;${kpis.lucroLiquido.toFixed(2)}`);
    rows.push(`Margem Liquida (%);${kpis.receitaTotal > 0 ? ((kpis.lucroLiquido / kpis.receitaTotal) * 100).toFixed(2) : '0.00'}`);
    rows.push('');

    rows.push('Receitas por Plano;Valor');
    receitasPorPlano.forEach((item) => {
      const plano = item.plano.charAt(0).toUpperCase() + item.plano.slice(1);
      rows.push(`${escapeCsv(plano)};${item.valor.toFixed(2)}`);
    });
    rows.push('');

    rows.push('Despesas por Categoria;Valor;Percentual (%)');
    despesasPorCategoria.forEach((item) => {
      const percentual = kpis.despesaTotal > 0 ? (item.valor / kpis.despesaTotal) * 100 : 0;
      rows.push(`${escapeCsv(categoriaNomes[item.categoria] || item.categoria)};${item.valor.toFixed(2)};${percentual.toFixed(2)}`);
    });
    rows.push('');

    rows.push('Margem por Plano;Receita;Custo;Lucro;Margem (%)');
    margemPorPlano.forEach((item) => {
      rows.push(`${escapeCsv(item.plano)};${item.receita.toFixed(2)};${item.custo.toFixed(2)};${item.lucro.toFixed(2)};${item.margem.toFixed(2)}`);
    });

    const csvContent = `\uFEFF${rows.join('\n')}`;
    const fileName = `relatorio-financeiro-${periodoSelecionado}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  const handleExportarPDF = async () => {
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new JsPDF({ unit: 'pt', format: 'a4' });

    doc.setFontSize(18);
    doc.text('Relatorio Financeiro - GymFinancas', 40, 42);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Periodo: ${periodoLabel}`, 40, 62);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 76);

    autoTable(doc, {
      startY: 92,
      head: [['Resumo', 'Valor']],
      body: [
        ['Receita Total', formatCurrency(kpis.receitaTotal)],
        ['Despesa Total', formatCurrency(kpis.despesaTotal)],
        ['Lucro Liquido', formatCurrency(kpis.lucroLiquido)],
        ['Margem Liquida', `${kpis.receitaTotal > 0 ? ((kpis.lucroLiquido / kpis.receitaTotal) * 100).toFixed(2) : '0.00'}%`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    const afterResumoY = (doc as any).lastAutoTable?.finalY ?? 120;

    autoTable(doc, {
      startY: afterResumoY + 16,
      head: [['Receitas por Plano', 'Valor']],
      body: receitasPorPlano.map((item) => [
        item.plano.charAt(0).toUpperCase() + item.plano.slice(1),
        formatCurrency(item.valor),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [2, 132, 199] },
    });

    const afterReceitasY = (doc as any).lastAutoTable?.finalY ?? afterResumoY + 20;

    autoTable(doc, {
      startY: afterReceitasY + 16,
      head: [['Despesas por Categoria', 'Valor', 'Percentual']],
      body: despesasPorCategoria.map((item) => {
        const percentual = kpis.despesaTotal > 0 ? (item.valor / kpis.despesaTotal) * 100 : 0;
        return [
          categoriaNomes[item.categoria] || item.categoria,
          formatCurrency(item.valor),
          `${percentual.toFixed(2)}%`,
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    const fileName = `relatorio-financeiro-${periodoSelecionado}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    const handleHeaderExportPdf = () => {
      void handleExportarPDF();
    };

    const handleHeaderExportExcel = () => {
      handleExportarExcel();
    };

    window.addEventListener('gymfinancas:export-relatorios-pdf', handleHeaderExportPdf);
    window.addEventListener('gymfinancas:export-relatorios-excel', handleHeaderExportExcel);

    return () => {
      window.removeEventListener('gymfinancas:export-relatorios-pdf', handleHeaderExportPdf);
      window.removeEventListener('gymfinancas:export-relatorios-excel', handleHeaderExportExcel);
    };
  }, [
    categoriaNomes,
    despesasPorCategoria,
    formatCurrency,
    kpis,
    margemPorPlano,
    periodoLabel,
    periodoSelecionado,
    receitasPorPlano,
  ]);

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-gray-700">Período:</label>
          <div className="flex gap-2">
            {(['mes', 'trimestre', 'semestre', 'ano'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodoSelecionado(p)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  periodoSelecionado === p
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DRE - Demonstração do Resultado do Exercício */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h3 className="text-gray-800">DRE - Demonstração do Resultado</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">Receita Bruta</span>
            <span className="text-gray-900">{formatCurrency(kpis.receitaTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">(-) Deduções e Cancelamentos</span>
            <span className="text-gray-900">R$ 0,00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">= Receita Líquida</span>
            <span className="text-gray-900">{formatCurrency(kpis.receitaTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">(-) Custos Operacionais</span>
            <span className="text-red-600">-{formatCurrency(kpis.despesaTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-4">
            <span className="text-gray-900">= Lucro/Prejuízo Líquido</span>
            <span className={`text-xl ${kpis.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(kpis.lucroLiquido)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Margem Líquida</span>
            <span className="text-gray-900">
              {kpis.receitaTotal > 0 ? ((kpis.lucroLiquido / kpis.receitaTotal) * 100).toFixed(2) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Análise de Lucratividade */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-gray-800">Análise de Lucratividade</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Custo por Aluno</p>
            <p className="text-2xl text-blue-600">{formatCurrency(custoMedioAluno)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">ROI Marketing</p>
            <p className="text-2xl text-purple-600">{roiMarketing.toFixed(1)}%</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Faturamento/Aluno</p>
            <p className="text-2xl text-teal-600">{formatCurrency(kpis.faturamentoMedioPorAluno)}</p>
          </div>
        </div>

        <h4 className="text-gray-700 mb-3">Margem por Plano</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase">Plano</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">Receita</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">Custo Est.</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">Lucro</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {margemPorPlano.map(item => (
                <tr key={item.plano}>
                  <td className="px-4 py-3 text-gray-900">{item.plano}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.receita)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(item.custo)}</td>
                  <td className={`px-4 py-3 text-right ${item.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.lucro)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{item.margem.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhamento de Despesas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-red-600" />
          <h3 className="text-gray-800">Detalhamento de Despesas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase">Categoria</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">Valor</th>
                <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase">% Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {despesasPorCategoria.map(item => {
                const percentual = (item.valor / kpis.despesaTotal) * 100;
                return (
                  <tr key={item.categoria}>
                    <td className="px-4 py-3 text-gray-900">{categoriaNomes[item.categoria] || item.categoria}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{percentual.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(kpis.despesaTotal)}</td>
                <td className="px-4 py-3 text-right text-gray-900">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Balanço Simplificado */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-6 h-6 text-indigo-600" />
          <h3 className="text-gray-800">Balanço Patrimonial Simplificado</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-700 mb-3">Ativo</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Caixa e Equivalentes</span>
                <span className="text-gray-900">{formatCurrency(kpis.lucroLiquido)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Contas a Receber</span>
                <span className="text-gray-900">{formatCurrency(kpis.fluxoCaixaProjetado)}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 rounded px-2">
                <span className="text-gray-900">Total do Ativo</span>
                <span className="text-gray-900">{formatCurrency(kpis.lucroLiquido + kpis.fluxoCaixaProjetado)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-gray-700 mb-3">Passivo e Patrimônio</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Contas a Pagar</span>
                <span className="text-gray-900">R$ 0,00</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Patrimônio Líquido</span>
                <span className="text-gray-900">{formatCurrency(kpis.lucroLiquido + kpis.fluxoCaixaProjetado)}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 rounded px-2">
                <span className="text-gray-900">Total do Passivo</span>
                <span className="text-gray-900">{formatCurrency(kpis.lucroLiquido + kpis.fluxoCaixaProjetado)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-800 mb-4">Indicadores de Performance (KPIs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Taxa de Inadimplência</p>
            <p className={`text-2xl ${kpis.taxaInadimplencia > 15 ? 'text-red-600' : 'text-yellow-600'}`}>
              {kpis.taxaInadimplencia.toFixed(1)}%
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Alunos Ativos</p>
            <p className="text-2xl text-green-600">{kpis.alunosAtivos}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Ticket Médio</p>
            <p className="text-2xl text-blue-600">{formatCurrency(kpis.faturamentoMedioPorAluno)}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Taxa de Retenção</p>
            <p className="text-2xl text-purple-600">
              {kpis.totalAlunos > 0 ? ((kpis.alunosAtivos / kpis.totalAlunos) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
