import { addMonths, subMonths, format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns';
import { patchDespesaApi } from './apiClient';

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  plano: 'mensal' | 'trimestral' | 'anual';
  valorPlano: number;
  dataMatricula: string;
  status: 'ativo' | 'inadimplente' | 'cancelado';
  filialId: string;
  dataUltimoPagamento?: string;
  diasAtraso?: number;
}

export interface Receita {
  id: string;
  alunoId: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pago' | 'pendente';
  tipo: 'mensalidade' | 'matricula' | 'taxa';
  filialId: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: 'aluguel' | 'salarios' | 'equipamentos' | 'marketing' | 'luz' | 'agua' | 'manutencao' | 'outros';
  tipo: 'fixa' | 'variavel';
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pago' | 'pendente';
  fornecedor: string;
  filialId: string;
  recorrente: boolean;
}

export interface Filial {
  id: string;
  nome: string;
  endereco: string;
}

export interface FluxoCaixa {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

const planoValores = {
  mensal: 100,
  trimestral: 270,
  anual: 960,
};

const PENDING_DESPESA_UPDATES_KEY = 'gym_financas_pending_despesa_updates';

type PendingDespesaUpdates = Record<string, { status?: Despesa['status']; dataPagamento?: string | null }>;

function getPendingDespesaUpdates(): PendingDespesaUpdates {
  try {
    const raw = localStorage.getItem(PENDING_DESPESA_UPDATES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setPendingDespesaUpdates(value: PendingDespesaUpdates) {
  try {
    localStorage.setItem(PENDING_DESPESA_UPDATES_KEY, JSON.stringify(value));
  } catch {
    // Ignore persistence errors for pending updates.
  }
}

function savePendingDespesaUpdate(id: string, updates: Partial<Despesa>) {
  const pending = getPendingDespesaUpdates();
  pending[id] = {
    status: updates.status,
    dataPagamento: updates.dataPagamento ?? null,
  };
  setPendingDespesaUpdates(pending);
}

function clearPendingDespesaUpdate(id: string) {
  const pending = getPendingDespesaUpdates();
  if (pending[id]) {
    delete pending[id];
    setPendingDespesaUpdates(pending);
  }
}

// Gerar dados de exemplo
function generateSampleData() {
  const filiais: Filial[] = [
    { id: '1', nome: 'Academia Centro', endereco: 'Rua Principal, 100' },
    { id: '2', nome: 'Academia Zona Norte', endereco: 'Av. Norte, 500' },
  ];

  const nomes = [
    'Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Oliveira', 'Carla Souza',
    'Lucas Ferreira', 'Juliana Lima', 'Rafael Almeida', 'Patrícia Rocha', 'Bruno Martins',
    'Fernanda Ribeiro', 'Gustavo Pereira', 'Camila Dias', 'Thiago Cardoso', 'Amanda Gomes',
    'Felipe Barbosa', 'Larissa Castro', 'Rodrigo Araújo', 'Beatriz Mendes', 'Diego Correia',
    'Isabela Freitas', 'Vitor Monteiro', 'Gabriela Teixeira', 'Mateus Pinto', 'Julia Cavalcanti',
    'Renato Barros', 'Vanessa Moreira', 'André Nunes', 'Carolina Ramos', 'Marcelo Cunha',
    'Aline Rezende', 'Paulo Fonseca', 'Mariana Campos', 'Fábio Castro', 'Débora Azevedo',
    'Leandro Moura', 'Tatiana Vieira', 'Ricardo Batista', 'Simone Duarte', 'Henrique Lima',
    'Priscila Melo', 'Daniel Borges', 'Cristina Pires', 'Alexandre Lopes', 'Mônica Carvalho',
    'Renan Santana', 'Letícia Nogueira', 'Vinícius Macedo', 'Natália Fernandes', 'Robson Tavares',
  ];

  const alunos: Aluno[] = nomes.map((nome, i) => {
    const planos: ('mensal' | 'trimestral' | 'anual')[] = ['mensal', 'trimestral', 'anual'];
    const plano = planos[Math.floor(Math.random() * planos.length)];
    const status = Math.random() > 0.15 ? 'ativo' : (Math.random() > 0.5 ? 'inadimplente' : 'cancelado');
    const dataMatricula = format(subMonths(new Date(), Math.floor(Math.random() * 12)), 'yyyy-MM-dd');
    const diasAtraso = status === 'inadimplente' ? Math.floor(Math.random() * 60) + 1 : 0;

    return {
      id: `aluno-${i + 1}`,
      nome,
      cpf: `${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
      email: `${nome.toLowerCase().replace(' ', '.')}@email.com`,
      plano,
      valorPlano: planoValores[plano],
      dataMatricula,
      status,
      filialId: i < 30 ? '1' : '2',
      dataUltimoPagamento: status !== 'cancelado' ? format(subMonths(new Date(), 1), 'yyyy-MM-dd') : undefined,
      diasAtraso,
    };
  });

  // Gerar receitas (mensalidades dos últimos 6 meses)
  const receitas: Receita[] = [];
  let receitaId = 1;

  alunos.forEach(aluno => {
    if (aluno.status === 'cancelado') return;

    for (let i = 5; i >= 0; i--) {
      const dataVencimento = format(subMonths(new Date(), i), 'yyyy-MM-10');
      const isPago = i > 0 ? (aluno.status === 'ativo' ? Math.random() > 0.1 : Math.random() > 0.6) : (aluno.status === 'ativo');

      receitas.push({
        id: `receita-${receitaId++}`,
        alunoId: aluno.id,
        valor: aluno.valorPlano,
        dataVencimento,
        dataPagamento: isPago ? format(parseISO(dataVencimento), 'yyyy-MM-dd') : undefined,
        status: isPago ? 'pago' : 'pendente',
        tipo: 'mensalidade',
        filialId: aluno.filialId,
      });
    }
  });

  // Gerar despesas recorrentes dos últimos 6 meses
  const despesasRecorrentes = [
    { descricao: 'Aluguel Academia Centro', categoria: 'aluguel' as const, valor: 5000, fornecedor: 'Imobiliária XYZ', filialId: '1' },
    { descricao: 'Aluguel Academia Zona Norte', categoria: 'aluguel' as const, valor: 4500, fornecedor: 'Imobiliária ABC', filialId: '2' },
    { descricao: 'Salários Professores Centro', categoria: 'salarios' as const, valor: 8000, fornecedor: 'Folha de Pagamento', filialId: '1' },
    { descricao: 'Salários Professores Zona Norte', categoria: 'salarios' as const, valor: 6500, fornecedor: 'Folha de Pagamento', filialId: '2' },
    { descricao: 'Conta de Luz Centro', categoria: 'luz' as const, valor: 1200, fornecedor: 'Energia Elétrica SA', filialId: '1' },
    { descricao: 'Conta de Luz Zona Norte', categoria: 'luz' as const, valor: 1000, fornecedor: 'Energia Elétrica SA', filialId: '2' },
    { descricao: 'Conta de Água Centro', categoria: 'agua' as const, valor: 400, fornecedor: 'Companhia de Água', filialId: '1' },
    { descricao: 'Conta de Água Zona Norte', categoria: 'agua' as const, valor: 350, fornecedor: 'Companhia de Água', filialId: '2' },
    { descricao: 'Marketing Digital', categoria: 'marketing' as const, valor: 2000, fornecedor: 'Agência Digital', filialId: '1' },
  ];

  const despesas: Despesa[] = [];
  let despesaId = 1;

  despesasRecorrentes.forEach(desp => {
    for (let i = 5; i >= 0; i--) {
      const dataVencimento = format(subMonths(new Date(), i), 'yyyy-MM-05');
      const isPago = i > 0 || Math.random() > 0.2;

      despesas.push({
        id: `despesa-${despesaId++}`,
        ...desp,
        tipo: 'fixa',
        dataVencimento,
        dataPagamento: isPago ? format(parseISO(dataVencimento), 'yyyy-MM-dd') : undefined,
        status: isPago ? 'pago' : 'pendente',
        recorrente: true,
      });
    }
  });

  // Adicionar despesas variáveis
  const despesasVariaveis = [
    { descricao: 'Manutenção Esteira', categoria: 'manutencao' as const, valor: 500, fornecedor: 'TechFit', filialId: '1', mes: 1 },
    { descricao: 'Compra de Halteres', categoria: 'equipamentos' as const, valor: 1500, fornecedor: 'FitEquip', filialId: '1', mes: 2 },
    { descricao: 'Reforma Vestiário', categoria: 'manutencao' as const, valor: 3000, fornecedor: 'Construtora ABC', filialId: '2', mes: 3 },
    { descricao: 'Novos Colchonetes', categoria: 'equipamentos' as const, valor: 800, fornecedor: 'FitEquip', filialId: '2', mes: 4 },
  ];

  despesasVariaveis.forEach((desp, idx) => {
    const dataVencimento = format(subMonths(new Date(), desp.mes), 'yyyy-MM-15');
    despesas.push({
      id: `despesa-${despesaId++}`,
      descricao: desp.descricao,
      categoria: desp.categoria,
      tipo: 'variavel',
      valor: desp.valor,
      dataVencimento,
      dataPagamento: format(parseISO(dataVencimento), 'yyyy-MM-dd'),
      status: 'pago',
      fornecedor: desp.fornecedor,
      filialId: desp.filialId,
      recorrente: false,
    });
  });

  return { alunos, receitas, despesas, filiais };
}

class DataService {
  private storageKey = 'gym_financas_data';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      const data = generateSampleData();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return;
    }

    try {
      const parsed = JSON.parse(existing);
      const normalized = this.normalizeData(parsed);
      localStorage.setItem(this.storageKey, JSON.stringify(normalized));
    } catch {
      const data = generateSampleData();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  private normalizeData(raw: any) {
    return {
      alunos: Array.isArray(raw?.alunos) ? raw.alunos : [],
      receitas: Array.isArray(raw?.receitas) ? raw.receitas : [],
      despesas: Array.isArray(raw?.despesas) ? raw.despesas : [],
      filiais: Array.isArray(raw?.filiais) ? raw.filiais : [],
    };
  }

  private getData() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      const data = generateSampleData();
      this.saveData(data);
      return data;
    }

    try {
      const parsed = JSON.parse(stored);
      const normalized = this.normalizeData(parsed);
      return normalized;
    } catch {
      const data = generateSampleData();
      this.saveData(data);
      return data;
    }
  }

  private saveData(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Alunos
  getAlunos(filialId?: string): Aluno[] {
    const data = this.getData();
    return filialId ? data.alunos.filter((a: Aluno) => a.filialId === filialId) : data.alunos;
  }

  addAluno(aluno: Omit<Aluno, 'id'>): Aluno {
    const data = this.getData();
    const newAluno = { ...aluno, id: `aluno-${Date.now()}` };
    data.alunos.push(newAluno);
    this.saveData(data);
    return newAluno;
  }

  updateAluno(id: string, updates: Partial<Aluno>): Aluno | null {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index !== -1) {
      data.alunos[index] = { ...data.alunos[index], ...updates };
      this.saveData(data);
      return data.alunos[index];
    }
    return null;
  }

  deleteAluno(id: string): boolean {
    const data = this.getData();
    const index = data.alunos.findIndex((a: Aluno) => a.id === id);
    if (index !== -1) {
      data.alunos.splice(index, 1);
      data.receitas = data.receitas.filter((r: Receita) => r.alunoId !== id);
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Receitas
  getReceitas(filialId?: string): Receita[] {
    const data = this.getData();
    return filialId ? data.receitas.filter((r: Receita) => r.filialId === filialId) : data.receitas;
  }

  updateReceita(id: string, updates: Partial<Receita>): Receita | null {
    const data = this.getData();
    const index = data.receitas.findIndex((r: Receita) => r.id === id);
    if (index !== -1) {
      data.receitas[index] = { ...data.receitas[index], ...updates };
      this.saveData(data);
      return data.receitas[index];
    }
    return null;
  }

  // Despesas
  getDespesas(filialId?: string): Despesa[] {
    const data = this.getData();
    return filialId ? data.despesas.filter((d: Despesa) => d.filialId === filialId) : data.despesas;
  }

  addDespesa(despesa: Omit<Despesa, 'id'>): Despesa {
    const data = this.getData();
    const newDespesa = { ...despesa, id: `despesa-${Date.now()}` };
    data.despesas.push(newDespesa);
    this.saveData(data);
    return newDespesa;
  }

  async updateDespesa(id: string, updates: Partial<Despesa>): Promise<Despesa | null> {
    const data = this.getData();
    const index = data.despesas.findIndex((d: Despesa) => String(d.id) === String(id));
    if (index !== -1) {
      const token = localStorage.getItem('gym_token');
      if (token && updates.status) {
        try {
          const resp = await patchDespesaApi(token, id, {
            status: updates.status,
            dataPagamento: updates.dataPagamento ?? null,
          });

          const despesaAtualizada = resp?.despesa;
          if (despesaAtualizada) {
            data.despesas[index] = {
              ...data.despesas[index],
              ...despesaAtualizada,
              dataPagamento: despesaAtualizada.dataPagamento ?? undefined,
            };
            clearPendingDespesaUpdate(id);
          } else {
            data.despesas[index] = { ...data.despesas[index], ...updates };
            savePendingDespesaUpdate(id, updates);
          }
        } catch {
          // Fallback local when backend update fails to keep UX responsive.
          data.despesas[index] = { ...data.despesas[index], ...updates };
          savePendingDespesaUpdate(id, updates);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gymfinancas:despesa-sync-fallback', {
              detail: { id },
            }));
          }
        }
      } else {
        data.despesas[index] = { ...data.despesas[index], ...updates };
      }

      this.saveData(data);
      return data.despesas[index];
    }
    return null;
  }

  // Filiais
  getFiliais(): Filial[] {
    const data = this.getData();
    return data.filiais;
  }

  // Cálculos e KPIs
  getKPIs(filialId?: string, startDate?: Date, endDate?: Date) {
    const alunos = this.getAlunos(filialId);
    const receitas = this.getReceitas(filialId);
    const despesas = this.getDespesas(filialId);

    const now = new Date();
    const start = startDate || startOfMonth(now);
    const end = endDate || endOfMonth(now);

    const receitasMes = receitas.filter(r => {
      const data = parseISO(r.dataVencimento);
      return isWithinInterval(data, { start, end });
    });

    const despesasMes = despesas.filter(d => {
      const data = parseISO(d.dataVencimento);
      return isWithinInterval(data, { start, end });
    });

    const receitaTotal = receitasMes.filter(r => r.status === 'pago').reduce((sum, r) => sum + r.valor, 0);
    const despesaTotal = despesasMes.filter(d => d.status === 'pago').reduce((sum, d) => sum + d.valor, 0);
    const lucroLiquido = receitaTotal - despesaTotal;

    const alunosAtivos = alunos.filter(a => a.status === 'ativo').length;
    const alunosInadimplentes = alunos.filter(a => a.status === 'inadimplente').length;
    const taxaInadimplencia = alunos.length > 0 ? (alunosInadimplentes / alunos.length) * 100 : 0;

    const faturamentoMedioPorAluno = alunosAtivos > 0 ? receitaTotal / alunosAtivos : 0;

    // Projeção de fluxo de caixa (próximos 30 dias)
    const receitasPendentes = receitas.filter(r => {
      const data = parseISO(r.dataVencimento);
      return r.status === 'pendente' && isWithinInterval(data, { start: now, end: addDays(now, 30) });
    }).reduce((sum, r) => sum + r.valor, 0);

    const despesasPendentes = despesas.filter(d => {
      const data = parseISO(d.dataVencimento);
      return d.status === 'pendente' && isWithinInterval(data, { start: now, end: addDays(now, 30) });
    }).reduce((sum, d) => sum + d.valor, 0);

    const fluxoCaixaProjetado = receitasPendentes - despesasPendentes;

    return {
      receitaTotal,
      despesaTotal,
      lucroLiquido,
      taxaInadimplencia,
      faturamentoMedioPorAluno,
      fluxoCaixaProjetado,
      alunosAtivos,
      alunosInadimplentes,
      totalAlunos: alunos.length,
    };
  }

  getFluxoCaixa(meses: number = 6, filialId?: string): FluxoCaixa[] {
    const receitas = this.getReceitas(filialId);
    const despesas = this.getDespesas(filialId);

    const fluxo: FluxoCaixa[] = [];
    let saldoAcumulado = 0;

    for (let i = meses - 1; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const start = startOfMonth(mes);
      const end = endOfMonth(mes);

      const entradas = receitas
        .filter(r => r.status === 'pago' && r.dataPagamento && isWithinInterval(parseISO(r.dataPagamento), { start, end }))
        .reduce((sum, r) => sum + r.valor, 0);

      const saidas = despesas
        .filter(d => d.status === 'pago' && d.dataPagamento && isWithinInterval(parseISO(d.dataPagamento), { start, end }))
        .reduce((sum, d) => sum + d.valor, 0);

      saldoAcumulado += entradas - saidas;

      fluxo.push({
        data: format(mes, 'yyyy-MM'),
        entradas,
        saidas,
        saldo: saldoAcumulado,
      });
    }

    return fluxo;
  }

  getDespesasPorCategoria(filialId?: string, startDate?: Date, endDate?: Date) {
    const despesas = this.getDespesas(filialId);
    const now = new Date();
    const start = startDate || startOfMonth(now);
    const end = endDate || endOfMonth(now);

    const despesasMes = despesas.filter(d => {
      const data = parseISO(d.dataVencimento);
      return d.status === 'pago' && isWithinInterval(data, { start, end });
    });

    const porCategoria: Record<string, number> = {};
    despesasMes.forEach(d => {
      porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
    });

    return Object.entries(porCategoria).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  }

  getReceitasPorPlano(filialId?: string, startDate?: Date, endDate?: Date) {
    const alunos = this.getAlunos(filialId);
    const receitas = this.getReceitas(filialId);
    const now = new Date();
    const start = startDate || startOfMonth(now);
    const end = endDate || endOfMonth(now);

    const receitasMes = receitas.filter(r => {
      const data = parseISO(r.dataVencimento);
      return r.status === 'pago' && isWithinInterval(data, { start, end });
    });

    const porPlano: Record<string, number> = { mensal: 0, trimestral: 0, anual: 0 };

    receitasMes.forEach(r => {
      const aluno = alunos.find(a => a.id === r.alunoId);
      if (aluno) {
        porPlano[aluno.plano] += r.valor;
      }
    });

    return Object.entries(porPlano).map(([plano, valor]) => ({
      plano,
      valor,
    }));
  }
}

export const dataService = new DataService();
