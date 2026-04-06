import React, { useEffect, useMemo, useState } from 'react';
import { dataService } from '../services/dataService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

export function FluxoCaixa() {
  const [periodo, setPeriodo] = useState<'3' | '6' | '12'>('6');

  useEffect(() => {
    const handleSetPeriodo = (event: Event) => {
      const customEvent = event as CustomEvent<'3' | '6' | '12'>;
      const value = customEvent.detail;
      if (value === '3' || value === '6' || value === '12') {
        setPeriodo(value);
      }
    };

    window.addEventListener('gymfinancas:set-fluxo-periodo', handleSetPeriodo as EventListener);
    return () => {
      window.removeEventListener('gymfinancas:set-fluxo-periodo', handleSetPeriodo as EventListener);
    };
  }, []);

  const fluxoCaixa = useMemo(() => dataService.getFluxoCaixa(parseInt(periodo)), [periodo]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Projeção futura (próximos 3 meses)
  const projecaoFutura = useMemo(() => {
    const ultimoMes = fluxoCaixa[fluxoCaixa.length - 1];
    if (!ultimoMes) return [];

    const mediaEntradas = fluxoCaixa.reduce((sum, f) => sum + f.entradas, 0) / fluxoCaixa.length;
    const mediaSaidas = fluxoCaixa.reduce((sum, f) => sum + f.saidas, 0) / fluxoCaixa.length;

    const projecoes = [];
    let saldoProjetado = ultimoMes.saldo;

    for (let i = 1; i <= 3; i++) {
      const mesProjecao = format(addMonths(new Date(), i), 'yyyy-MM');
      saldoProjetado += mediaEntradas - mediaSaidas;

      projecoes.push({
        data: mesProjecao,
        entradas: mediaEntradas,
        saidas: mediaSaidas,
        saldo: saldoProjetado,
        projetado: true,
      });
    }

    return projecoes;
  }, [fluxoCaixa]);

  const dadosCompletos = useMemo(() => {
    return [
      ...fluxoCaixa.map(f => ({ ...f, projetado: false })),
      ...projecaoFutura,
    ];
  }, [fluxoCaixa, projecaoFutura]);

  const saldoAtual = fluxoCaixa.length > 0 ? fluxoCaixa[fluxoCaixa.length - 1].saldo : 0;
  const saldoProjetado3Meses = projecaoFutura.length > 0 ? projecaoFutura[projecaoFutura.length - 1].saldo : 0;
  const variacao = saldoAtual > 0 ? ((saldoProjetado3Meses - saldoAtual) / saldoAtual) * 100 : 0;

  // Despesas fixas para reserva de emergência
  const despesas = dataService.getDespesas();
  const despesasFixasMensais = despesas
    .filter(d => d.tipo === 'fixa' && d.recorrente)
    .reduce((sum, d) => sum + d.valor, 0);
  const reservaEmergencia = despesasFixasMensais * 3;
  const temReserva = saldoAtual >= reservaEmergencia;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Saldo Atual</p>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <p className={`text-3xl mb-3 ${saldoAtual >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatCurrency(saldoAtual)}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>Período: {periodo} meses</span>
          </div>
        </div>

        {/* Projeção 3 Meses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Projeção 3 Meses</p>
            <Calendar className="w-6 h-6 text-teal-500" />
          </div>
          <p className={`text-3xl mb-1 ${saldoProjetado3Meses >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{formatCurrency(saldoProjetado3Meses)}</p>
          <p className={`text-sm flex items-center gap-1 mb-3 ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variacao >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
          </p>
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>Baseado nos últimos {periodo} meses</span>
          </div>
        </div>

        {/* Reserva Emergência */}
        <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${temReserva ? 'border-green-500' : 'border-yellow-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Reserva Emergência</p>
            <AlertCircle className={`w-6 h-6 ${temReserva ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <p className="text-3xl text-gray-800 mb-1">{formatCurrency(reservaEmergencia)}</p>
          <p className={`text-sm mb-3 ${temReserva ? 'text-green-600' : 'text-yellow-600'}`}>
            {temReserva ? 'Objetivo atingido ✓' : 'Abaixo do recomendado'}
          </p>
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>= 3× despesas fixas/mês</span>
          </div>
        </div>

        {/* Despesas Fixas/Mês */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Despesas Fixas/Mês</p>
            <TrendingDown className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-3xl text-gray-800 mb-3">{formatCurrency(despesasFixasMensais)}</p>
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>{despesas.filter(d => d.tipo === 'fixa' && d.recorrente).length} despesas recorrentes</span>
          </div>
        </div>
      </div>

      {/* Alerta de Saldo Baixo */}
      {saldoAtual < 5000 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-red-800">Alerta: Saldo Crítico</h4>
              <p className="text-red-700 text-sm mt-1">
                O saldo está abaixo de R$ 5.000. Recomendamos cortar despesas não essenciais imediatamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Linha - Evolução e Projeção */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-800 mb-4">Evolução e Projeção do Saldo</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dadosCompletos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Saldo"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.projetado ? '#06b6d4' : '#3b82f6'}
                    stroke={payload.projetado ? '#06b6d4' : '#3b82f6'}
                    strokeWidth={2}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-500 mt-2 text-center">
          * Valores após o último mês histórico são projeções baseadas na média do período
        </p>
      </div>

      {/* Gráfico de Barras - Entradas vs Saídas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-gray-800 mb-4">Entradas vs Saídas por Mês</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={fluxoCaixa}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
            <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="text-gray-800 p-6 pb-0">Detalhamento Mensal</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Mês</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Entradas</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Saídas</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Resultado</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dadosCompletos.map((item, idx) => {
                const resultado = item.entradas - item.saidas;
                return (
                  <tr key={idx} className={`hover:bg-gray-50 ${item.projetado ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">
                        {format(new Date(item.data), 'MMM/yyyy')}
                        {item.projetado && <span className="ml-2 text-xs text-blue-600">(Projeção)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-green-600">{formatCurrency(item.entradas)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(item.saidas)}</td>
                    <td className={`px-6 py-4 text-right ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(resultado)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
