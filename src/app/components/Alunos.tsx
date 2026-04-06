import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { dataService, Aluno } from '../services/dataService';
import { Search, Mail, AlertCircle, CheckCircle, XCircle, DollarSign, QrCode, Pencil, Trash2, Send } from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths, addYears } from 'date-fns';

const ALUNOS_FORM_DRAFT_KEY = 'gym_financas_alunos_form_draft';

export function Alunos({ initialFilter }: { initialFilter?: 'all' | 'ativo' | 'inadimplente' | 'cancelado' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inadimplente' | 'cancelado'>(initialFilter ?? 'all');
  const [selectedFilialId, setSelectedFilialId] = useState<string | undefined>(undefined);
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const filiais = useMemo(() => dataService.getFiliais(), []);
  const [newAlunoNome, setNewAlunoNome] = useState('');
  const [newAlunoEmail, setNewAlunoEmail] = useState('');
  const [newAlunoCpf, setNewAlunoCpf] = useState('');
  const [newAlunoPlano, setNewAlunoPlano] = useState<Aluno['plano']>('mensal');
  const [newAlunoStatus, setNewAlunoStatus] = useState<Aluno['status']>('ativo');
  const [newAlunoDataPagamento, setNewAlunoDataPagamento] = useState('');
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formError, setFormError] = useState('');
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixAluno, setPixAluno] = useState<Aluno | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmAluno, setDeleteConfirmAluno] = useState<Aluno | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [bulkMessageSubject, setBulkMessageSubject] = useState('Comunicado GymFinanças');
  const [bulkMessageBody, setBulkMessageBody] = useState('Olá!\n\nEstamos entrando em contato com um comunicado importante da academia.\n\nAtenciosamente,\nEquipe GymFinanças');

  // Carrega alunos na inicialização
  useEffect(() => {
    const loadedAlunos = dataService.getAlunos();
    setAlunos(loadedAlunos);

    try {
      const rawDraft = localStorage.getItem(ALUNOS_FORM_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as {
          showModal?: boolean;
          editingAlunoId?: string | null;
          form?: {
            nome?: string;
            email?: string;
            cpf?: string;
            plano?: Aluno['plano'];
            status?: Aluno['status'];
            dataPagamento?: string;
          };
        };

        if (draft.form) {
          setNewAlunoNome(draft.form.nome ?? '');
          setNewAlunoEmail(draft.form.email ?? '');
          setNewAlunoCpf(draft.form.cpf ?? '');
          setNewAlunoPlano(draft.form.plano ?? 'mensal');
          setNewAlunoStatus(draft.form.status ?? 'ativo');
          setNewAlunoDataPagamento(draft.form.dataPagamento ?? '');
        }

        if (draft.editingAlunoId) {
          const existingAluno = loadedAlunos.find((aluno) => aluno.id === draft.editingAlunoId) ?? null;
          setEditingAluno(existingAluno);
        }

        if (draft.showModal) {
          setShowAddModal(true);
        }
      }
    } catch {
      // Ignore invalid draft data.
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    try {
      localStorage.setItem(
        ALUNOS_FORM_DRAFT_KEY,
        JSON.stringify({
          showModal: showAddModal,
          editingAlunoId: editingAluno?.id ?? null,
          form: {
            nome: newAlunoNome,
            email: newAlunoEmail,
            cpf: newAlunoCpf,
            plano: newAlunoPlano,
            status: newAlunoStatus,
            dataPagamento: newAlunoDataPagamento,
          },
        }),
      );
    } catch {
      // Keep UX responsive even if draft persistence fails.
    }
  }, [
    editingAluno,
    loading,
    newAlunoCpf,
    newAlunoDataPagamento,
    newAlunoEmail,
    newAlunoNome,
    newAlunoPlano,
    newAlunoStatus,
    showAddModal,
  ]);

  const baseAlunos = useMemo(() => {
    return selectedFilialId ? alunos.filter(a => a.filialId === selectedFilialId) : alunos;
  }, [alunos, selectedFilialId]);

  const filteredAlunos = useMemo(() => {
    return baseAlunos.filter(aluno => {
      const matchesSearch = 
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.cpf.includes(searchTerm);
      const matchesFilter = filterStatus === 'all' || aluno.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [baseAlunos, searchTerm, filterStatus]);

  const selectedAlunos = useMemo(() => {
    return alunos.filter((aluno) => selectedAlunoIds.includes(aluno.id));
  }, [alunos, selectedAlunoIds]);

  const allFilteredSelected = filteredAlunos.length > 0 && filteredAlunos.every((aluno) => selectedAlunoIds.includes(aluno.id));

  const calcDiasAtraso = useCallback((aluno: Aluno): number => {
    if (aluno.status !== 'inadimplente') return 0;
    if (!aluno.dataUltimoPagamento) return aluno.diasAtraso ?? 0;
    const ultimoPag = parseISO(aluno.dataUltimoPagamento);
    const vencimento = aluno.plano === 'anual'
      ? addYears(ultimoPag, 1)
      : aluno.plano === 'trimestral'
        ? addMonths(ultimoPag, 3)
        : addMonths(ultimoPag, 1);
    const diff = differenceInDays(new Date(), vencimento);
    return diff > 0 ? diff : 0;
  }, []);

  const inadimplentes = useMemo(() => {
    return baseAlunos.filter(a => a.status === 'inadimplente' && calcDiasAtraso(a) > 30);
  }, [baseAlunos, calcDiasAtraso]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  const formatStatusCount = (count: number) => {
    return count === 0 ? '-' : count;
  };

  const getFilialNome = useCallback((filialId: string) => {
    return filiais.find((filial) => filial.id === filialId)?.nome ?? 'Filial não identificada';
  }, [filiais]);

  const getStatusBadge = useCallback((status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
      ativo: { bg: 'bg-green-100 dark:bg-emerald-950/50', text: 'text-green-800 dark:text-emerald-300', icon: CheckCircle, label: 'Ativo' },
      inadimplente: { bg: 'bg-yellow-100 dark:bg-amber-950/50', text: 'text-yellow-800 dark:text-amber-300', icon: AlertCircle, label: 'Inadimplente' },
      cancelado: { bg: 'bg-red-100 dark:bg-red-950/50', text: 'text-red-800 dark:text-red-300', icon: XCircle, label: 'Cancelado' },
    };

    if (!status || !(status in config)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
          -
        </span>
      );
    }

    const { bg, text, icon: Icon, label } = config[status as keyof typeof config];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  }, []);

  const handleEnviarCobranca = useCallback((aluno: Aluno) => {
    const subject = encodeURIComponent('Cobrança de Mensalidade GymFinanças');
    const body = encodeURIComponent(
      `Olá ${aluno.nome},\n\nIdentificamos que sua mensalidade de ${formatCurrency(aluno.valorPlano)} está em atraso. Por favor, efetue o pagamento o mais breve possível para evitar a suspensão do serviço.\n\nObrigado,\nEquipe GymFinanças`,
    );
    window.location.href = `mailto:${aluno.email}?subject=${subject}&body=${body}`;
  }, [formatCurrency]);

  const handleToggleAlunoSelection = useCallback((id: string) => {
    setSelectedAlunoIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  }, []);

  const handleToggleSelectAllFiltered = useCallback(() => {
    setSelectedAlunoIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredAlunos.some((aluno) => aluno.id === id));
      }

      return [...new Set([...current, ...filteredAlunos.map((aluno) => aluno.id)])];
    });
  }, [allFilteredSelected, filteredAlunos]);

  const handleOpenBulkMessageModal = useCallback(() => {
    setShowBulkMessageModal(true);
  }, []);

  const handleSendBulkMessage = useCallback(() => {
    if (selectedAlunos.length === 0) {
      return;
    }

    const recipients = selectedAlunos
      .map((aluno) => aluno.email)
      .filter(Boolean)
      .join(',');

    const subject = encodeURIComponent(bulkMessageSubject.trim() || 'Comunicado GymFinanças');
    const body = encodeURIComponent(bulkMessageBody.trim());
    window.location.href = `mailto:?bcc=${encodeURIComponent(recipients)}&subject=${subject}&body=${body}`;
  }, [bulkMessageBody, bulkMessageSubject, selectedAlunos]);

  const handleBulkUpdateAlunoStatus = useCallback((target: 'pago' | 'pendente') => {
    if (selectedAlunoIds.length === 0) {
      return;
    }

    const nextStatus: Aluno['status'] = target === 'pago' ? 'ativo' : 'inadimplente';
    const nextDataPagamento = target === 'pago' ? format(new Date(), 'yyyy-MM-dd') : undefined;

    setAlunos((current) => current.map((aluno) => {
      if (!selectedAlunoIds.includes(aluno.id)) {
        return aluno;
      }

      const updated: Aluno = {
        ...aluno,
        status: nextStatus,
        dataUltimoPagamento: nextDataPagamento,
        diasAtraso: target === 'pago' ? 0 : (aluno.diasAtraso ?? 0),
      };

      dataService.updateAluno(aluno.id, {
        status: updated.status,
        dataUltimoPagamento: updated.dataUltimoPagamento,
        diasAtraso: updated.diasAtraso,
      });

      return updated;
    }));

    setSelectedAlunoIds([]);
  }, [selectedAlunoIds]);

  const handleGerarPix = useCallback((aluno: Aluno) => {
    setPixAluno(aluno);
    setCopySuccess(false);
    setShowPixModal(true);
  }, []);

  const handleCopiarPix = useCallback(() => {
    if (!pixAluno) return;
    
    const pixCode = `PIX|Nome:${pixAluno.nome}|Valor:${formatCurrency(pixAluno.valorPlano)}|Email:${pixAluno.email}`;
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2800);
    }).catch(() => {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = pixCode;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2800);
    });
  }, [pixAluno, formatCurrency]);

  const openEditAluno = useCallback((aluno: Aluno) => {
    setEditingAluno(aluno);
    setNewAlunoNome(aluno.nome);
    setNewAlunoEmail(aluno.email);
    setNewAlunoCpf(aluno.cpf);
    setNewAlunoPlano(aluno.plano);
    setNewAlunoStatus(aluno.status);
    setNewAlunoDataPagamento(aluno.dataUltimoPagamento || '');
    setFormError('');
    setShowAddModal(true);
  }, []);

  const openDetailsAluno = useCallback((aluno: Aluno) => {
    setSelectedAluno(aluno);
  }, []);

  const closeDetailsAluno = useCallback(() => {
    setSelectedAluno(null);
  }, []);

  const resetNewAlunoForm = useCallback(() => {
    setEditingAluno(null);
    setNewAlunoNome('');
    setNewAlunoEmail('');
    setNewAlunoCpf('');
    setNewAlunoPlano('mensal');
    setNewAlunoStatus('ativo');
    setNewAlunoDataPagamento('');
    setFormError('');
  }, []);

  const clearAlunoDraft = useCallback(() => {
    try {
      localStorage.removeItem(ALUNOS_FORM_DRAFT_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }, []);

  useEffect(() => {
    const handleOpenAddFromHeader = () => {
      resetNewAlunoForm();
      setShowAddModal(true);
    };

    const handleFilterInadimplentes = () => {
      setFilterStatus('inadimplente');
    };

    window.addEventListener('gymfinancas:open-add-aluno', handleOpenAddFromHeader as EventListener);
    window.addEventListener('gymfinancas:filter-alunos-inadimplentes', handleFilterInadimplentes);
    return () => {
      window.removeEventListener('gymfinancas:open-add-aluno', handleOpenAddFromHeader as EventListener);
      window.removeEventListener('gymfinancas:filter-alunos-inadimplentes', handleFilterInadimplentes);
    };
  }, [resetNewAlunoForm]);

  const handleDeleteAluno = useCallback(() => {
    if (!deleteConfirmAluno) return;
    dataService.deleteAluno(deleteConfirmAluno.id);
    setAlunos(prev => prev.filter(a => a.id !== deleteConfirmAluno.id));
    setSelectedAlunoIds(prev => prev.filter(id => id !== deleteConfirmAluno.id));
    setDeleteConfirmAluno(null);
  }, [deleteConfirmAluno]);

  const handleSaveAluno = useCallback(() => {
    setFormError('');

    if (!newAlunoNome.trim() || !newAlunoEmail.trim() || !newAlunoCpf.trim()) {
      setFormError('Nome, email e CPF são obrigatórios.');
      return;
    }

    if (!newAlunoDataPagamento) {
      setFormError('Data do último pagamento é obrigatória.');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAlunoEmail.trim())) {
      setFormError('Email inválido.');
      return;
    }

    // Validação básica de CPF
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    if (!cpfRegex.test(newAlunoCpf.trim())) {
      setFormError('CPF deve estar no formato 000.000.000-00');
      return;
    }

    const alunoPayload: Omit<Aluno, 'id'> = {
      nome: newAlunoNome.trim(),
      email: newAlunoEmail.trim(),
      cpf: newAlunoCpf.trim(),
      plano: newAlunoPlano,
      valorPlano: newAlunoPlano === 'mensal' ? 100 : newAlunoPlano === 'trimestral' ? 270 : 960,
      dataMatricula: editingAluno ? editingAluno.dataMatricula : format(new Date(), 'yyyy-MM-dd'),
      status: newAlunoStatus,
      filialId: editingAluno ? editingAluno.filialId : '1',
      dataUltimoPagamento: newAlunoDataPagamento || undefined,
      diasAtraso: newAlunoStatus === 'inadimplente' ? (editingAluno?.diasAtraso ?? 0) : 0,
    };

    try {
      if (editingAluno) {
        const updatedAluno = dataService.updateAluno(editingAluno.id, alunoPayload);
        if (updatedAluno) {
          setAlunos(prev => prev.map(a => a.id === updatedAluno.id ? updatedAluno : a));
        }
      } else {
        const createdAluno = dataService.addAluno(alunoPayload);
        setAlunos(prev => [...prev, createdAluno]);
      }

      setShowAddModal(false);
      resetNewAlunoForm();
      clearAlunoDraft();
    } catch (error) {
      setFormError('Erro ao salvar aluno. Tente novamente.');
    }
  }, [
    newAlunoNome, newAlunoEmail, newAlunoCpf, newAlunoPlano, 
    newAlunoStatus, newAlunoDataPagamento, editingAluno, resetNewAlunoForm, clearAlunoDraft
  ]);

  useEffect(() => {
    setSelectedAlunoIds((current) => current.filter((id) => alunos.some((aluno) => aluno.id === id)));
  }, [alunos]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6 alunos-screen">
      <style>{`
        @keyframes alunosFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .alunos-screen .section-enter {
          opacity: 0;
          transform: translateY(10px);
          animation: alunosFadeUp 0.42s ease-out forwards;
        }

        .alunos-screen .delay-1 {
          animation-delay: 0.06s;
        }

        .alunos-screen .delay-2 {
          animation-delay: 0.12s;
        }

        .alunos-screen .bulk-actions {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 55%, #eff6ff 100%);
        }

        .dark .alunos-screen .bulk-actions {
          background: linear-gradient(135deg, rgba(6, 78, 59, 0.34) 0%, rgba(15, 118, 110, 0.26) 55%, rgba(30, 64, 175, 0.22) 100%);
        }
      `}</style>
      {/* Seletor de Filial */}
      <div className="flex items-center gap-3 section-enter">
        <span className="text-sm text-gray-500">Filial:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedFilialId(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              selectedFilialId === undefined
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400'
            }`}
          >
            Todas
          </button>
          {filiais.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilialId(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                selectedFilialId === f.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400'
              }`}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 section-enter delay-1">
        {/* Total de Alunos */}
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`text-left bg-white rounded-2xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'all' ? 'border-gray-400 ring-2 ring-gray-300' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Total de Alunos</p>
          <p className="text-3xl text-gray-900 mb-3">{baseAlunos.length}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>{selectedFilialId ? filiais.find(f => f.id === selectedFilialId)?.nome : `${alunos.filter(a => a.filialId === '1').length} Centro · ${alunos.filter(a => a.filialId === '2').length} Zona Norte`}</span>
            <span className="text-gray-400">Ver todos →</span>
          </div>
        </button>

        {/* Alunos Ativos */}
        <button
          type="button"
          onClick={() => setFilterStatus('ativo')}
          className={`text-left bg-white rounded-2xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'ativo' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Alunos Ativos</p>
          <p className="text-3xl text-emerald-600 mb-3">
            {formatStatusCount(baseAlunos.filter(a => a.status === 'ativo').length)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>
              {baseAlunos.length > 0
                ? `${Math.round((baseAlunos.filter(a => a.status === 'ativo').length / baseAlunos.length) * 100)}% do total`
                : '0% do total'}
            </span>
            <span className="text-emerald-500">Filtrar ativos →</span>
          </div>
        </button>

        {/* Inadimplentes */}
        <button
          type="button"
          onClick={() => setFilterStatus('inadimplente')}
          className={`text-left bg-white rounded-2xl shadow-sm p-6 border transition-all hover:shadow-md cursor-pointer ${filterStatus === 'inadimplente' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-100'}`}
        >
          <p className="text-gray-600 mb-2 text-sm font-medium">Inadimplentes</p>
          <p className="text-3xl text-yellow-600 mb-3">
            {formatStatusCount(baseAlunos.filter(a => a.status === 'inadimplente').length)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
            <span>
              {formatCurrency(
                baseAlunos.filter(a => a.status === 'inadimplente').reduce((sum, a) => sum + a.valorPlano, 0)
              )} em aberto
            </span>
            <span className="text-yellow-600">Ver inadimplentes →</span>
          </div>
        </button>
      </div>

      {/* Modal de Adição/Edição */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
              <p className="text-gray-600 mt-2">
                {editingAluno ? 'Atualize os dados do aluno.' : 'Preencha todos os campos obrigatórios.'}
              </p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Nome Completo *</label>
                  <input
                    type="text"
                    value={newAlunoNome}
                    onChange={(e) => setNewAlunoNome(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Email *</label>
                  <input
                    type="email"
                    value={newAlunoEmail}
                    onChange={(e) => setNewAlunoEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">CPF *</label>
                  <input
                    type="text"
                    value={newAlunoCpf}
                    onChange={(e) => setNewAlunoCpf(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Plano</label>
                  <select
                    value={newAlunoPlano}
                    onChange={(e) => setNewAlunoPlano(e.target.value as Aluno['plano'])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="mensal">Mensal - R$ 100,00</option>
                    <option value="trimestral">Trimestral - R$ 270,00</option>
                    <option value="anual">Anual - R$ 960,00</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                  <select
                    value={newAlunoStatus}
                    onChange={(e) => setNewAlunoStatus(e.target.value as Aluno['status'])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inadimplente">Inadimplente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Data Último Pagamento *</label>
                  <input
                    type="date"
                    value={newAlunoDataPagamento}
                    onChange={(e) => setNewAlunoDataPagamento(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewAlunoForm();
                    clearAlunoDraft();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAluno}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
                >
                  {editingAluno ? 'Salvar Alterações' : 'Criar Aluno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Inadimplentes */}
      {inadimplentes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-semibold text-yellow-900 mb-2">
                {inadimplentes.length} aluno{inadimplentes.length > 1 ? 's' : ''} com +30 dias de atraso
              </h4>
              <p className="text-yellow-800 text-sm mb-4">
                Inicie uma campanha de cobrança para recuperar essas receitas.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md">
                  Cobrança em Massa
                </button>
                <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md">
                  Gerar PIX Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 section-enter delay-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'ativo', 'inadimplente', 'cancelado'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedAlunoIds.length > 0 && (
        <div className="bulk-actions border border-emerald-200/80 dark:border-emerald-700/50 rounded-2xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between section-enter delay-2">
          <div>
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">{selectedAlunoIds.length} aluno(s) selecionado(s)</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-200/90 mt-1">Use a central de mensagens para falar com todos os alunos marcados.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkUpdateAlunoStatus('pendente')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              Marcar como Pendente
            </button>
            <button
              type="button"
              onClick={() => handleBulkUpdateAlunoStatus('pago')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              Marcar como Pago
            </button>
            <button
              type="button"
              onClick={handleOpenBulkMessageModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              Mandar mensagem
            </button>
            <button
              type="button"
              onClick={() => setSelectedAlunoIds([])}
              className="px-4 py-2.5 border border-emerald-200/90 dark:border-emerald-700/60 bg-white/85 dark:bg-slate-900/55 text-emerald-900 dark:text-emerald-100 rounded-xl text-sm font-medium transition-all hover:bg-white dark:hover:bg-slate-900"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden section-enter delay-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAllFiltered}
                    className="w-4 h-4 accent-emerald-500"
                    aria-label="Selecionar alunos filtrados"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aluno</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Último Pag.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Nenhum aluno encontrado' 
                      : 'Nenhum aluno cadastrado. Crie o primeiro!'
                    }
                  </td>
                </tr>
              ) : (
                filteredAlunos.map(aluno => (
                  <tr
                    key={aluno.id}
                    onClick={() => openDetailsAluno(aluno)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedAlunoIds.includes(aluno.id)}
                        onChange={() => handleToggleAlunoSelection(aluno.id)}
                        className="w-4 h-4 accent-emerald-500"
                        aria-label={`Selecionar aluno ${aluno.nome}`}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-gray-900">{aluno.nome}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">{aluno.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-800 capitalize">
                        {aluno.plano}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-gray-900">{formatCurrency(aluno.valorPlano)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(aluno.status)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-700">
                        {aluno.dataUltimoPagamento 
                          ? format(parseISO(aluno.dataUltimoPagamento), 'dd/MM/yy') 
                          : '-'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditAluno(aluno);
                          }}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl hover:shadow-sm transition-all group"
                          title="Editar"
                          aria-label="Editar aluno"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteConfirmAluno(aluno);
                          }}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl hover:shadow-sm transition-all group"
                          title="Excluir"
                          aria-label="Excluir aluno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {aluno.status === 'inadimplente' && (
                          <>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEnviarCobranca(aluno);
                              }}
                              className="p-2.5 text-yellow-600 hover:bg-yellow-50 rounded-xl hover:shadow-sm transition-all group"
                              title="Enviar cobrança"
                              aria-label="Enviar cobrança por email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleGerarPix(aluno);
                              }}
                              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl hover:shadow-sm transition-all group"
                              title="Gerar PIX"
                              aria-label="Gerar código PIX"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && closeDetailsAluno()}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h3>
                <p className="text-gray-600 mt-1">Informações completas para acompanhamento do cadastro e recebimento.</p>
              </div>
              <button
                onClick={closeDetailsAluno}
                className="p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                aria-label="Fechar detalhes do aluno"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Nome</p>
                <p className="mt-2 text-xl text-gray-900">{selectedAluno.nome}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-2 text-gray-900 break-all">{selectedAluno.email}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">CPF</p>
                <p className="mt-2 text-gray-900">{selectedAluno.cpf}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Plano</p>
                <p className="mt-2 text-gray-900 capitalize">{selectedAluno.plano}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Valor do Plano</p>
                <p className="mt-2 text-gray-900">{formatCurrency(selectedAluno.valorPlano)}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Status</p>
                <div className="mt-2">{getStatusBadge(selectedAluno.status)}</div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Filial</p>
                <p className="mt-2 text-gray-900">{getFilialNome(selectedAluno.filialId)}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Data de Matrícula</p>
                <p className="mt-2 text-gray-900">{format(parseISO(selectedAluno.dataMatricula), 'dd/MM/yyyy')}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Último Pagamento</p>
                <p className="mt-2 text-gray-900">
                  {selectedAluno.dataUltimoPagamento ? format(parseISO(selectedAluno.dataUltimoPagamento), 'dd/MM/yyyy') : 'Não informado'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Dias de Atraso</p>
                <p className="mt-2 text-gray-900">{selectedAluno.status === 'inadimplente' ? calcDiasAtraso(selectedAluno) : 0}</p>
              </div>
            </div>

            <div className="p-8 border-t border-gray-200 flex flex-wrap justify-end gap-3">
              {selectedAluno.status === 'inadimplente' && (
                <>
                  <button
                    onClick={() => handleEnviarCobranca(selectedAluno)}
                    className="px-5 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-all font-medium"
                  >
                    Enviar cobrança
                  </button>
                  <button
                    onClick={() => handleGerarPix(selectedAluno)}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-medium"
                  >
                    Gerar PIX
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  closeDetailsAluno();
                  openEditAluno(selectedAluno);
                }}
                className="px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Editar aluno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteConfirmAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setDeleteConfirmAluno(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Excluir Aluno</h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-gray-700 mb-2">
              Tem certeza que deseja excluir <span className="font-semibold">{deleteConfirmAluno.nome}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Todos os registros de mensalidades deste aluno também serão removidos.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmAluno(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAluno}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setShowBulkMessageModal(false)}>
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Central de Mensagens</h3>
                <p className="text-gray-600 mt-1">Envie uma mensagem para todos os alunos selecionados.</p>
              </div>
              <button
                onClick={() => setShowBulkMessageModal(false)}
                className="p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                aria-label="Fechar central de mensagens"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Destinatários</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAlunos.map((aluno) => (
                    <span key={aluno.id} className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                      {aluno.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Assunto</label>
                <input
                  type="text"
                  value={bulkMessageSubject}
                  onChange={(e) => setBulkMessageSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Digite o assunto da mensagem"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Mensagem</label>
                <textarea
                  value={bulkMessageBody}
                  onChange={(e) => setBulkMessageBody(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Digite a mensagem que será enviada aos alunos selecionados"
                />
              </div>
            </div>

            <div className="p-8 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkMessageModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSendBulkMessage}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
              >
                <Mail className="w-4 h-4" />
                Enviar mensagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIX */}
      {showPixModal && pixAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setShowPixModal(false)}>
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">PIX Cobrança - {pixAluno.nome}</h3>
                <p className="text-gray-600 dark:text-slate-400 mt-1">{formatCurrency(pixAluno.valorPlano)}</p>
              </div>
              <button
                onClick={() => setShowPixModal(false)}
                className="p-3 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                aria-label="Fechar modal"
              >
                <XCircle className="w-6 h-6 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-8 border border-emerald-200 dark:border-emerald-800">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                        `PIX|Nome:${pixAluno.nome}|Valor:${formatCurrency(pixAluno.valorPlano)}|Email:${pixAluno.email}`
                      )}`}
                      alt="QR Code PIX"
                      className="w-72 h-72 rounded-2xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Apresente o QR Code</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 max-w-md">
                      Aponte a câmera do celular para ler automaticamente
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Código PIX</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Copie e envie por WhatsApp</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-full">
                      Rápido
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 font-mono text-sm text-gray-900 dark:text-slate-200 min-h-[100px] flex items-center justify-center border border-gray-200 dark:border-slate-700">
                    <code className="break-all text-center">
                      PIX|Nome:{pixAluno.nome}|Valor:{formatCurrency(pixAluno.valorPlano)}|Email:{pixAluno.email}
                    </code>
                  </div>
                </div>
                
                <button
                  onClick={handleCopiarPix}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  Copiar Código PIX
                </button>
                
                {copySuccess && (
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">Código copiado!</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-slate-500 text-center">
                  Cole no WhatsApp ou envie por email após copiar
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}