import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { dataService, Despesa } from '../services/dataService';
import { Calendar, Search, CheckCircle, Clock, Pencil, CircleCheck, X } from 'lucide-react';
import { format, parseISO, addDays, isBefore } from 'date-fns';

const DESPESAS_ADD_DRAFT_KEY = 'gym_financas_despesas_add_draft';
const DESPESAS_EDIT_DRAFT_KEY = 'gym_financas_despesas_edit_draft';

export function Despesas({ initialFilter }: { initialFilter?: 'all' | 'pago' | 'pendente' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>(initialFilter ?? 'all');
  const [selectedDespesaIds, setSelectedDespesaIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Omit<Despesa,'id'>>>({});
  const [addError, setAddError] = useState('');
  const filiais = useMemo(() => dataService.getFiliais(), []);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [editForm, setEditForm] = useState<Partial<Despesa>>({});
  const [editError, setEditError] = useState('');
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null);
  const [syncFallbackWarning, setSyncFallbackWarning] = useState(false);
  const restoredDraftRef = useRef(false);

  const [despesas, setDespesas] = useState<Despesa[]>(() => dataService.getDespesas());

  useEffect(() => {
    if (restoredDraftRef.current) {
      return;
    }

    restoredDraftRef.current = true;

    try {
      const rawAddDraft = localStorage.getItem(DESPESAS_ADD_DRAFT_KEY);
      if (rawAddDraft) {
        const addDraft = JSON.parse(rawAddDraft) as {
          showModal?: boolean;
          form?: Partial<Omit<Despesa, 'id'>>;
        };

        if (addDraft.form) {
          setAddForm(addDraft.form);
        }

        if (addDraft.showModal) {
          setShowAddModal(true);
        }
      }
    } catch {
      // Ignore invalid add draft data.
    }

    try {
      const rawEditDraft = localStorage.getItem(DESPESAS_EDIT_DRAFT_KEY);
      if (rawEditDraft) {
        const editDraft = JSON.parse(rawEditDraft) as {
          showModal?: boolean;
          editingDespesaId?: string | null;
          form?: Partial<Despesa>;
        };

        if (editDraft.form) {
          setEditForm(editDraft.form);
        }

        if (editDraft.editingDespesaId) {
          const existingDespesa = despesas.find((item) => item.id === editDraft.editingDespesaId) ?? null;
          setEditingDespesa(existingDespesa);
        }

        if (editDraft.showModal) {
          setShowEditModal(true);
        }
      }
    } catch {
      // Ignore invalid edit draft data.
    }
  }, [despesas]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DESPESAS_ADD_DRAFT_KEY,
        JSON.stringify({
          showModal: showAddModal,
          form: addForm,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [addForm, showAddModal]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DESPESAS_EDIT_DRAFT_KEY,
        JSON.stringify({
          showModal: showEditModal,
          editingDespesaId: editingDespesa?.id ?? null,
          form: editForm,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [editForm, editingDespesa, showEditModal]);

  const clearAddDraft = useCallback(() => {
    try {
      localStorage.removeItem(DESPESAS_ADD_DRAFT_KEY);
    } catch {
      // Ignore cleanup errors.
    }
  }, []);

  const clearEditDraft = useCallback(() => {
    try {
      localStorage.removeItem(DESPESAS_EDIT_DRAFT_KEY);
    } catch {
      // Ignore cleanup errors.
    }
  }, []);

  const filteredDespesas = useMemo(() => {
    return despesas.filter(despesa => {
      const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           despesa.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || despesa.status === filterStatus;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => parseISO(b.dataVencimento).getTime() - parseISO(a.dataVencimento).getTime());
  }, [despesas, searchTerm, filterStatus]);

  const proximosVencimentos = useMemo(() => {
    const now = new Date();
    const proximos7Dias = addDays(now, 7);
    return despesas.filter(d => {
      if (d.status === 'pago') return false;
      const vencimento = parseISO(d.dataVencimento);
      return vencimento >= now && vencimento <= proximos7Dias;
    });
  }, [despesas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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

  const getFilialNome = useCallback((filialId: string) => {
    return filiais.find((filial) => filial.id === filialId)?.nome ?? 'Filial não identificada';
  }, [filiais]);

  const allFilteredSelected = filteredDespesas.length > 0 && filteredDespesas.every((despesa) => selectedDespesaIds.includes(despesa.id));

  const handleOpenAdd = useCallback(() => {
    setAddForm({
      descricao: '',
      categoria: 'outros',
      tipo: 'variavel',
      valor: 0,
      dataVencimento: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
      fornecedor: '',
      filialId: filiais[0]?.id ?? '',
      recorrente: false,
    });
    setAddError('');
    setShowAddModal(true);
  }, [filiais]);

  useEffect(() => {
    const handleOpenAddFromHeader = () => {
      handleOpenAdd();
    };

    const handleFilterPendentes = () => {
      setFilterStatus('pendente');
    };

    window.addEventListener('gymfinancas:open-add-despesa', handleOpenAddFromHeader as EventListener);
    window.addEventListener('gymfinancas:filter-despesas-pendentes', handleFilterPendentes);
    return () => {
      window.removeEventListener('gymfinancas:open-add-despesa', handleOpenAddFromHeader as EventListener);
      window.removeEventListener('gymfinancas:filter-despesas-pendentes', handleFilterPendentes);
    };
  }, [handleOpenAdd]);

  const handleCloseAdd = useCallback(() => {
    setShowAddModal(false);
    setAddForm({});
    setAddError('');
    clearAddDraft();
  }, [clearAddDraft]);

  const handleSaveAdd = useCallback(async () => {
    if (!addForm.descricao?.trim()) { setAddError('Descrição é obrigatória.'); return; }
    if (!addForm.valor || addForm.valor <= 0) { setAddError('Informe um valor válido.'); return; }
    if (!addForm.dataVencimento) { setAddError('Data de vencimento é obrigatória.'); return; }
    if (!addForm.fornecedor?.trim()) { setAddError('Fornecedor é obrigatório.'); return; }
    try {
      const nova = dataService.addDespesa(addForm as Omit<Despesa, 'id'>);
      setDespesas(prev => [...prev, nova]);
      handleCloseAdd();
      clearAddDraft();
    } catch {
      setAddError('Erro ao salvar. Tente novamente.');
    }
  }, [addForm, handleCloseAdd, clearAddDraft]);

  const handleOpenEdit = useCallback((despesa: Despesa) => {
    setEditingDespesa(despesa);
    setEditForm({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      tipo: despesa.tipo,
      valor: despesa.valor,
      dataVencimento: despesa.dataVencimento,
      dataPagamento: despesa.dataPagamento ?? '',
      status: despesa.status,
      fornecedor: despesa.fornecedor,
      recorrente: despesa.recorrente,
    });
    setEditError('');
    setShowEditModal(true);
  }, []);

  const handleOpenDetails = useCallback((despesa: Despesa) => {
    setSelectedDespesa(despesa);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedDespesa(null);
  }, []);

  const handleToggleDespesaSelection = useCallback((id: string) => {
    setSelectedDespesaIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  }, []);

  const handleToggleSelectAllFiltered = useCallback(() => {
    setSelectedDespesaIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredDespesas.some((despesa) => despesa.id === id));
      }

      const filteredIds = filteredDespesas.map((despesa) => despesa.id);
      return [...new Set([...current, ...filteredIds])];
    });
  }, [allFilteredSelected, filteredDespesas]);

  const handleBulkUpdateStatus = useCallback(async (status: 'pago' | 'pendente') => {
    if (selectedDespesaIds.length === 0) {
      return;
    }

    const dataPagamento = status === 'pago' ? format(new Date(), 'yyyy-MM-dd') : undefined;

    try {
      for (const id of selectedDespesaIds) {
        await dataService.updateDespesa(id, {
          status,
          dataPagamento,
        });
      }

      // Rehydrate from storage to ensure UI mirrors what was actually persisted.
      setDespesas(dataService.getDespesas());
      setSelectedDespesaIds([]);
    } catch {
      alert('Erro ao atualizar as despesas selecionadas.');
    }
  }, [selectedDespesaIds]);

  useEffect(() => {
    setSelectedDespesaIds((current) => current.filter((id) => despesas.some((despesa) => despesa.id === id)));
  }, [despesas]);

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleSyncFallback = () => {
      setSyncFallbackWarning(true);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setSyncFallbackWarning(false);
      }, 4000);
    };

    window.addEventListener('gymfinancas:despesa-sync-fallback', handleSyncFallback as EventListener);
    return () => {
      window.removeEventListener('gymfinancas:despesa-sync-fallback', handleSyncFallback as EventListener);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingDespesa(null);
    setEditForm({});
    setEditError('');
    clearEditDraft();
  }, [clearEditDraft]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingDespesa) return;
    if (!editForm.descricao?.trim()) { setEditError('Descrição é obrigatória.'); return; }
    if (!editForm.valor || editForm.valor <= 0) { setEditError('Informe um valor válido.'); return; }
    if (!editForm.dataVencimento) { setEditError('Data de vencimento é obrigatória.'); return; }
    try {
      await dataService.updateDespesa(editingDespesa.id, editForm);
      setDespesas(prev => prev.map(d =>
        d.id === editingDespesa.id ? { ...d, ...editForm } as Despesa : d
      ));
      handleCloseEdit();
      clearEditDraft();
    } catch {
      setEditError('Erro ao salvar. Tente novamente.');
    }
  }, [editingDespesa, editForm, handleCloseEdit, clearEditDraft]);

  const handleMarcarPago = async (id: string) => {
    try {
      const dataPagamento = format(new Date(), 'yyyy-MM-dd');
      await dataService.updateDespesa(id, { status: 'pago', dataPagamento });
      setDespesas(prev => prev.map(d =>
        d.id === id ? { ...d, status: 'pago', dataPagamento } : d
      ));
    } catch {
      alert('Erro ao persistir a despesa no backend.');
    }
  };

  const totalPago = useMemo(() => {
    return despesas
      .filter(d => d.status === 'pago')
      .reduce((sum, d) => sum + d.valor, 0);
  }, [despesas]);

  const totalPendente = useMemo(() => {
    return despesas
      .filter(d => d.status === 'pendente')
      .reduce((sum, d) => sum + d.valor, 0);
  }, [despesas]);

  return (
    <div className="space-y-6 despesas-screen">
      <style>{`
        @keyframes despesasFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .despesas-screen .section-enter {
          opacity: 0;
          transform: translateY(10px);
          animation: despesasFadeUp 0.42s ease-out forwards;
        }

        .despesas-screen .delay-1 {
          animation-delay: 0.06s;
        }

        .despesas-screen .delay-2 {
          animation-delay: 0.12s;
        }

        .despesas-screen .bulk-actions {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 55%, #eff6ff 100%);
        }

        .dark .despesas-screen .bulk-actions {
          background: linear-gradient(135deg, rgba(6, 78, 59, 0.34) 0%, rgba(15, 118, 110, 0.26) 55%, rgba(30, 64, 175, 0.22) 100%);
        }
      `}</style>
      {/* Alertas de Vencimento */}
      {proximosVencimentos.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 section-enter">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-blue-800 font-normal">
                {proximosVencimentos.length} despesas vencem nos próximos 7 dias
              </h4>
              <div className="mt-2 space-y-1">
                {proximosVencimentos.slice(0, 3).map(d => (
                  <p key={d.id} className="text-blue-700 text-sm">
                    • {d.descricao} - {formatCurrency(d.valor)} (vence em {format(parseISO(d.dataVencimento), 'dd/MM/yyyy')})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {syncFallbackWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 section-enter">
          <p className="text-sm text-amber-800">
            Alteração salva localmente. A sincronização com o backend falhou neste momento.
          </p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 section-enter delay-1">
        {/* Total de Despesas */}
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`text-left bg-white rounded-xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'all' ? 'border-gray-400 ring-2 ring-gray-300' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Total de Despesas</p>
          <p className="text-3xl text-gray-800 mb-3">{despesas.length}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>{despesas.filter(d => d.tipo === 'fixa').length} fixas · {despesas.filter(d => d.tipo === 'variavel').length} variáveis</span>
            <span className="text-gray-400">Ver todas →</span>
          </div>
        </button>

        {/* Total Pago */}
        <button
          type="button"
          onClick={() => setFilterStatus('pago')}
          className={`text-left bg-white rounded-xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'pago' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Total Pago</p>
          <p className="text-3xl text-green-600 mb-3">{formatCurrency(totalPago)}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>{despesas.filter(d => d.status === 'pago').length} despesas pagas</span>
            <span className="text-green-500">Filtrar pagas →</span>
          </div>
        </button>

        {/* Total Pendente */}
        <button
          type="button"
          onClick={() => setFilterStatus('pendente')}
          className={`text-left bg-white rounded-xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'pendente' ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Total Pendente</p>
          <p className="text-3xl text-red-600 mb-3">{formatCurrency(totalPendente)}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>{despesas.filter(d => d.status === 'pendente').length} despesas pendentes</span>
            <span className="text-red-500">Filtrar pendentes →</span>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 section-enter delay-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descrição ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pago', 'pendente'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedDespesaIds.length > 0 && (
        <div className="bulk-actions border border-emerald-200/80 dark:border-emerald-700/50 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between section-enter delay-2">
          <div>
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">{selectedDespesaIds.length} despesa(s) selecionada(s)</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-200/90 mt-1">Use as ações abaixo para atualizar o status em lote.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkUpdateStatus('pendente')}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              Marcar como Pendente
            </button>
            <button
              type="button"
              onClick={() => handleBulkUpdateStatus('pago')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              Marcar como Pago
            </button>
            <button
              type="button"
              onClick={() => setSelectedDespesaIds([])}
              className="px-4 py-2 rounded-lg border border-emerald-200/90 dark:border-emerald-700/60 bg-white/85 dark:bg-slate-900/55 text-emerald-900 dark:text-emerald-100 text-sm font-medium transition-all hover:bg-white dark:hover:bg-slate-900"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Despesas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden section-enter delay-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAllFiltered}
                    className="w-4 h-4 accent-emerald-500"
                    aria-label="Selecionar despesas filtradas"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDespesas.map(despesa => {
                const vencido = despesa.status === 'pendente' && isBefore(parseISO(despesa.dataVencimento), new Date());
                return (
                  <tr
                    key={despesa.id}
                    onClick={() => handleOpenDetails(despesa)}
                    className={`cursor-pointer hover:bg-gray-50 ${vencido ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDespesaIds.includes(despesa.id)}
                        onChange={() => handleToggleDespesaSelection(despesa.id)}
                        className="w-4 h-4 accent-emerald-500"
                        aria-label={`Selecionar despesa ${despesa.descricao}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-normal">{despesa.descricao}</p>
                      {despesa.recorrente && (
                        <span className="text-xs text-blue-600">Recorrente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{categoriaNomes[despesa.categoria]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{despesa.fornecedor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-normal">{formatCurrency(despesa.valor)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${vencido ? 'text-red-600' : 'text-gray-700'}`}>
                        {format(parseISO(despesa.dataVencimento), 'dd/MM/yyyy')}
                        {vencido && <p className="text-xs text-red-600">Vencido</p>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {despesa.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-amber-950/50 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {despesa.status === 'pendente' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMarcarPago(despesa.id);
                            }}
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Marcar como Pago"
                          >
                            <CircleCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEdit(despesa);
                          }}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar despesa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDespesa && (
        <div
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDetails();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalhes da Despesa</h3>
                <p className="text-sm text-gray-500 mt-1">Informações completas para acompanhamento e conferência.</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar detalhes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Descrição</p>
                <p className="mt-2 text-lg text-gray-900">{selectedDespesa.descricao}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Categoria</p>
                <p className="mt-2 text-gray-900">{categoriaNomes[selectedDespesa.categoria]}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</p>
                <p className="mt-2 text-gray-900">{selectedDespesa.tipo === 'fixa' ? 'Fixa' : 'Variável'}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fornecedor</p>
                <p className="mt-2 text-gray-900">{selectedDespesa.fornecedor}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filial</p>
                <p className="mt-2 text-gray-900">{getFilialNome(selectedDespesa.filialId)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Valor</p>
                <p className="mt-2 text-gray-900">{formatCurrency(selectedDespesa.valor)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                <p className="mt-2 text-gray-900">{selectedDespesa.status === 'pago' ? 'Pago' : 'Pendente'}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vencimento</p>
                <p className="mt-2 text-gray-900">{format(parseISO(selectedDespesa.dataVencimento), 'dd/MM/yyyy')}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Data de Pagamento</p>
                <p className="mt-2 text-gray-900">
                  {selectedDespesa.dataPagamento ? format(parseISO(selectedDespesa.dataPagamento), 'dd/MM/yyyy') : 'Ainda não paga'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recorrência</p>
                <p className="mt-2 text-gray-900">{selectedDespesa.recorrente ? 'Despesa recorrente' : 'Despesa avulsa'}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleCloseDetails();
                  handleOpenEdit(selectedDespesa);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                Editar despesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Despesa */}
      {showAddModal && (
        <div
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseAdd(); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Nova Despesa</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {addError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{addError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={addForm.descricao ?? ''}
                  onChange={(e) => setAddForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={addForm.categoria ?? 'outros'}
                    onChange={(e) => setAddForm(f => ({ ...f, categoria: e.target.value as Despesa['categoria'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(categoriaNomes).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={addForm.tipo ?? 'variavel'}
                    onChange={(e) => setAddForm(f => ({ ...f, tipo: e.target.value as Despesa['tipo'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="fixa">Fixa</option>
                    <option value="variavel">Variável</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.valor ?? ''}
                    onChange={(e) => setAddForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={addForm.status ?? 'pendente'}
                    onChange={(e) => setAddForm(f => ({ ...f, status: e.target.value as Despesa['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={addForm.dataVencimento ?? ''}
                    onChange={(e) => setAddForm(f => ({ ...f, dataVencimento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                {filiais.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filial</label>
                    <select
                      value={addForm.filialId ?? ''}
                      onChange={(e) => setAddForm(f => ({ ...f, filialId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      {filiais.map(fil => (
                        <option key={fil.id} value={fil.id}>{fil.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={addForm.fornecedor ?? ''}
                  onChange={(e) => setAddForm(f => ({ ...f, fornecedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-recorrente"
                  checked={addForm.recorrente ?? false}
                  onChange={(e) => setAddForm(f => ({ ...f, recorrente: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label htmlFor="add-recorrente" className="text-sm text-gray-700">Despesa recorrente</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseAdd}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdd}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Edição */}
      {showEditModal && editingDespesa && (
        <div
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseEdit(); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editar Despesa</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={editForm.descricao ?? ''}
                  onChange={(e) => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={editForm.categoria ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, categoria: e.target.value as Despesa['categoria'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(categoriaNomes).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editForm.tipo ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, tipo: e.target.value as Despesa['tipo'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="fixa">Fixa</option>
                    <option value="variavel">Variável</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.valor ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as Despesa['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={editForm.dataVencimento ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, dataVencimento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Pagamento</label>
                  <input
                    type="date"
                    value={editForm.dataPagamento ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, dataPagamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={editForm.fornecedor ?? ''}
                  onChange={(e) => setEditForm(f => ({ ...f, fornecedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-recorrente"
                  checked={editForm.recorrente ?? false}
                  onChange={(e) => setEditForm(f => ({ ...f, recorrente: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label htmlFor="edit-recorrente" className="text-sm text-gray-700">Despesa recorrente</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
