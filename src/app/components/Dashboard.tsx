import React, { useMemo, useState } from 'react';
import { dataService } from '../services/dataService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const [filialId, setFilialId] = useState<string | undefined>(undefined);
  const filiais = useMemo(() => dataService.getFiliais(), []);
  const kpis = useMemo(() => dataService.getKPIs(filialId), [filialId]);
  const fluxoCaixa = useMemo(() => dataService.getFluxoCaixa(6, filialId), [filialId]);
  const despesasPorCategoria = useMemo(() => dataService.getDespesasPorCategoria(filialId), [filialId]);
  const receitasPorPlano = useMemo(() => dataService.getReceitasPorPlano(filialId), [filialId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
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

  const planoNomes: Record<string, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    anual: 'Anual',
  };

  const despesasFormatadas = despesasPorCategoria.map(d => ({
    ...d,
    categoria: categoriaNomes[d.categoria] || d.categoria,
  }));

  const receitasFormatadas = receitasPorPlano.map(r => ({
    ...r,
    plano: planoNomes[r.plano] || r.plano,
  }));

  return (
    <div className="space-y-6">
      {/* Seletor de Filial */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Filial:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilialId(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filialId === undefined
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400'
            }`}
          >
            Todas
          </button>
          {filiais.map(f => (
            <button
              key={f.id}
              onClick={() => setFilialId(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filialId === f.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400'
              }`}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Receita do Mês</p>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-3xl text-gray-800">{formatCurrency(kpis.receitaTotal)}</p>
          <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Receitas pagas
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Despesas do Mês</p>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-3xl text-gray-800">{formatCurrency(kpis.despesaTotal)}</p>
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            Despesas pagas
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Lucro Líquido</p>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl text-gray-800">{formatCurrency(kpis.lucroLiquido)}</p>
          <p className="text-sm text-blue-600 mt-2">
            Margem: {kpis.receitaTotal > 0 ? ((kpis.lucroLiquido / kpis.receitaTotal) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Fluxo Projetado</p>
            <TrendingUp className="w-8 h-8 text-teal-500" />
          </div>
          <p className="text-3xl text-gray-800">{formatCurrency(kpis.fluxoCaixaProjetado)}</p>
          <p className="text-sm text-gray-600 mt-2">Próximos 30 dias</p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Alunos Ativos</p>
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-2xl text-gray-800">{kpis.alunosAtivos}</p>
          <p className="text-sm text-gray-500 mt-1">de {kpis.totalAlunos} totais</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Taxa de Inadimplência</p>
            <AlertCircle className={`w-6 h-6 ${kpis.taxaInadimplencia > 15 ? 'text-red-500' : 'text-yellow-500'}`} />
          </div>
          <p className="text-2xl text-gray-800">{kpis.taxaInadimplencia.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">{kpis.alunosInadimplentes} alunos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Faturamento Médio</p>
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-2xl text-gray-800">{formatCurrency(kpis.faturamentoMedioPorAluno)}</p>
          <p className="text-sm text-gray-500 mt-1">por aluno ativo</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas por Plano */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-800 mb-4">Receitas por Plano</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={receitasFormatadas}
                dataKey="valor"
                nameKey="plano"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.plano}: ${formatCurrency(entry.valor)}`}
              >
                {receitasFormatadas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Despesas por Categoria */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-800 mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={despesasFormatadas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="valor" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-800 mb-4">Evolução do Fluxo de Caixa (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={fluxoCaixa}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" strokeWidth={2} />
            <Line type="monotone" dataKey="saidas" stroke="#ef4444" name="Saídas" strokeWidth={2} />
            <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas */}
      {kpis.lucroLiquido < 5000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-yellow-800">Atenção: Saldo Baixo</h4>
            <p className="text-yellow-700 text-sm mt-1">
              O lucro líquido está abaixo de R$ 5.000. Considere cortar despesas não essenciais.
            </p>
          </div>
        </div>
      )}

      {kpis.taxaInadimplencia > 15 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-red-800">Alerta: Alta Inadimplência</h4>
            <p className="text-red-700 text-sm mt-1">
              A taxa de inadimplência está em {kpis.taxaInadimplencia.toFixed(1)}%. Inicie uma campanha de cobrança.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
