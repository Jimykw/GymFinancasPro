import { dataService } from './dataService';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  targetPage: string;
  filter?: string;
  level: 'high' | 'medium' | 'info';
}

export function getNotifications(): NotificationItem[] {
  const kpis = dataService.getKPIs();
  const alunosInadimplentes = dataService
    .getAlunos()
    .filter((aluno) => aluno.status === 'inadimplente').length;
  const despesasPendentes = dataService
    .getDespesas()
    .filter((despesa) => despesa.status === 'pendente').length;

  const list: NotificationItem[] = [];

  if (alunosInadimplentes > 0) {
    list.push({
      id: 'inadimplencia',
      title: 'Inadimplência ativa',
      message: `${alunosInadimplentes} aluno(s) com pagamento pendente.`,
      actionLabel: 'Abrir Alunos',
      targetPage: 'alunos',
      filter: 'inadimplente',
      level: alunosInadimplentes > 8 ? 'high' : 'medium',
    });
  }

  if (despesasPendentes > 0) {
    list.push({
      id: 'despesas-pendentes',
      title: 'Contas a pagar',
      message: `${despesasPendentes} despesa(s) pendentes para acompanhamento.`,
      actionLabel: 'Abrir Despesas',
      targetPage: 'despesas',
      filter: 'pendente',
      level: despesasPendentes > 10 ? 'high' : 'medium',
    });
  }

  if (kpis.taxaInadimplencia > 15) {
    list.push({
      id: 'taxa-inadimplencia',
      title: 'Risco financeiro',
      message: `Taxa de inadimplência em ${kpis.taxaInadimplencia.toFixed(1)}%.`,
      actionLabel: 'Ver Relatórios',
      targetPage: 'relatorios',
      level: 'high',
    });
  }

  if (kpis.lucroLiquido < 5000) {
    list.push({
      id: 'lucro-baixo',
      title: 'Lucro abaixo da meta',
      message: 'Resultado líquido abaixo de R$ 5.000 no período.',
      actionLabel: 'Abrir Dashboard',
      targetPage: 'dashboard',
      level: 'medium',
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'operacao-estavel',
      title: 'Operação estável',
      message: 'Sem alertas críticos no momento.',
      actionLabel: 'Ver Dashboard',
      targetPage: 'dashboard',
      level: 'info',
    });
  }

  return list;
}