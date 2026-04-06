import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filial } from '../services/dataService';
import { getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection } from '../services/supabaseClient';
import {
  Building2,
  Cloud,
  Database,
  Download,
  HardDriveDownload,
  HardDriveUpload,
  Plus,
  Save,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

type SupabaseStatus = 'connected' | 'disconnected' | 'unknown';
const SETTINGS_STORAGE_KEY = 'gym_financas_settings';
const SUPABASE_DRAFT_STORAGE_KEY = 'gym_financas_supabase_draft';

interface PersistedSettings {
  proLabore?: number;
}

export function Configuracoes() {
  const inputImportRef = useRef<HTMLInputElement | null>(null);

  const [proLabore, setProLabore] = useState<number>(5000);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [showFilialModal, setShowFilialModal] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [filialNome, setFilialNome] = useState('');
  const [filialEndereco, setFilialEndereco] = useState('');
  const [filialError, setFilialError] = useState('');
  const [filialToRemove, setFilialToRemove] = useState<Filial | null>(null);

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('unknown');
  const [supabaseMessage, setSupabaseMessage] = useState('');
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsedSettings: PersistedSettings | null = savedSettings ? JSON.parse(savedSettings) : null;
      const persistedProLabore = parsedSettings?.proLabore;

      if (Number.isFinite(persistedProLabore)) {
        setProLabore(persistedProLabore as number);
      } else {
        const savedProLabore = localStorage.getItem('gym_financas_proLabore');
        if (savedProLabore) {
          const value = Number(JSON.parse(savedProLabore));
          if (Number.isFinite(value)) {
            setProLabore(value);
          }
        }
      }
    } catch {
      setProLabore(5000);
    }

    try {
      const rawData = localStorage.getItem('gym_financas_data');
      if (!rawData) {
        setFiliais([]);
        return;
      }

      const parsed = JSON.parse(rawData);
      setFiliais(Array.isArray(parsed.filiais) ? parsed.filiais : []);
    } catch {
      setFiliais([]);
    }

    try {
      const savedDraft = localStorage.getItem(SUPABASE_DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft) as { url?: string; key?: string };
        setSupabaseUrl(typeof parsedDraft.url === 'string' ? parsedDraft.url : '');
        setSupabaseKey(typeof parsedDraft.key === 'string' ? parsedDraft.key : '');
      } else {
        const savedSupabase = getSupabaseConfig();
        setSupabaseUrl(savedSupabase?.url || '');
        setSupabaseKey(savedSupabase?.key || '');
      }
    } catch {
      const savedSupabase = getSupabaseConfig();
      setSupabaseUrl(savedSupabase?.url || '');
      setSupabaseKey(savedSupabase?.key || '');
    }

    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem('gym_financas_proLabore', JSON.stringify(proLabore));

      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsedSettings: PersistedSettings = savedSettings ? JSON.parse(savedSettings) : {};
      parsedSettings.proLabore = proLabore;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsedSettings));
    } catch {
      // Keep UI responsive even if persistence fails.
    }
  }, [proLabore, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        SUPABASE_DRAFT_STORAGE_KEY,
        JSON.stringify({ url: supabaseUrl, key: supabaseKey }),
      );
    } catch {
      // Keep UI responsive even if draft persistence fails.
    }
  }, [supabaseUrl, supabaseKey, settingsLoaded]);

  useEffect(() => {
    const initStatus = async () => {
      const config = getSupabaseConfig();
      if (!config?.url || !config?.key) {
        setSupabaseStatus('disconnected');
        setSupabaseMessage('Nenhuma configuracao salva.');
        return;
      }

      try {
        const result = await testSupabaseConnection(config);
        setSupabaseStatus(result.ok ? 'connected' : 'disconnected');
        setSupabaseMessage(result.message);
      } catch {
        setSupabaseStatus('disconnected');
        setSupabaseMessage('Falha ao verificar conexao com Supabase.');
      }
    };

    initStatus();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const persistFiliais = useCallback((nextFiliais: Filial[]) => {
    try {
      const rawData = localStorage.getItem('gym_financas_data');
      const parsed = rawData ? JSON.parse(rawData) : {};
      parsed.filiais = nextFiliais;
      localStorage.setItem('gym_financas_data', JSON.stringify(parsed));
      setFiliais(nextFiliais);
    } catch {
      alert('Nao foi possivel salvar as filiais.');
    }
  }, []);

  const salvarProLabore = () => {
    try {
      localStorage.setItem('gym_financas_proLabore', JSON.stringify(proLabore));

      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsedSettings: PersistedSettings = savedSettings ? JSON.parse(savedSettings) : {};
      parsedSettings.proLabore = proLabore;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsedSettings));

      setShowSaveModal(true);
    } catch {
      alert('Nao foi possivel salvar o pro-labore.');
    }
  };

  const abrirNovaFilial = () => {
    setFilialToRemove(null);
    setEditingFilial(null);
    setFilialNome('');
    setFilialEndereco('');
    setFilialError('');
    setShowFilialModal(true);
  };

  const abrirEditarFilial = (filial: Filial) => {
    setFilialToRemove(null);
    setEditingFilial(filial);
    setFilialNome(filial.nome);
    setFilialEndereco(filial.endereco);
    setFilialError('');
    setShowFilialModal(true);
  };

  const fecharFilialModal = () => {
    setShowFilialModal(false);
    setEditingFilial(null);
    setFilialNome('');
    setFilialEndereco('');
    setFilialError('');
  };

  const salvarFilial = () => {
    if (!filialNome.trim() || !filialEndereco.trim()) {
      setFilialError('Nome e endereco sao obrigatorios.');
      return;
    }

    const nextFiliais = editingFilial
      ? filiais.map((item) =>
          item.id === editingFilial.id
            ? { ...item, nome: filialNome.trim(), endereco: filialEndereco.trim() }
            : item,
        )
      : [
          ...filiais,
          {
            id: `filial-${Date.now()}`,
            nome: filialNome.trim(),
            endereco: filialEndereco.trim(),
          },
        ];

    persistFiliais(nextFiliais);
    fecharFilialModal();
  };

  const removerFilial = (filialId: string) => {
    const nextFiliais = filiais.filter((item) => item.id !== filialId);
    persistFiliais(nextFiliais);
    setFilialToRemove(null);
  };

  const salvarSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseStatus('disconnected');
      setSupabaseMessage('URL e chave sao obrigatorios.');
      return;
    }

    setSupabaseLoading(true);
    try {
      const config = { url: supabaseUrl.trim(), key: supabaseKey.trim() };
      saveSupabaseConfig(config);
      localStorage.removeItem(SUPABASE_DRAFT_STORAGE_KEY);
      const result = await testSupabaseConnection(config);
      setSupabaseStatus(result.ok ? 'connected' : 'disconnected');
      setSupabaseMessage(result.message);
    } catch {
      setSupabaseStatus('disconnected');
      setSupabaseMessage('Erro ao salvar ou testar conexao com Supabase.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  const exportarBackup = () => {
    try {
      const data = localStorage.getItem('gym_financas_data');
      if (!data) {
        alert('Nao ha dados para exportar.');
        return;
      }

      const payload = {
        version: 2,
        data: JSON.parse(data),
        settings: {
          proLabore,
          supabase: getSupabaseConfig(),
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gymfinancas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert('Falha ao exportar backup.');
    }
  };

  useEffect(() => {
    const handleHeaderExport = () => {
      exportarBackup();
    };

    const handleHeaderImport = () => {
      inputImportRef.current?.click();
    };

    window.addEventListener('gymfinancas:export-backup', handleHeaderExport);
    window.addEventListener('gymfinancas:import-backup', handleHeaderImport);

    return () => {
      window.removeEventListener('gymfinancas:export-backup', handleHeaderExport);
      window.removeEventListener('gymfinancas:import-backup', handleHeaderImport);
    };
  }, []);

  const importarBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = String(loadEvent.target?.result || '');
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid backup');
        }

        // Backward compatibility: old format stores raw gym_financas_data object at root.
        if (parsed.version === 2 && parsed.data) {
          localStorage.setItem('gym_financas_data', JSON.stringify(parsed.data));

          if (typeof parsed.settings?.proLabore === 'number') {
            localStorage.setItem('gym_financas_proLabore', JSON.stringify(parsed.settings.proLabore));
            const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const parsedSettings: PersistedSettings = savedSettings ? JSON.parse(savedSettings) : {};
            parsedSettings.proLabore = parsed.settings.proLabore;
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsedSettings));
          }

          if (parsed.settings?.supabase?.url && parsed.settings?.supabase?.key) {
            saveSupabaseConfig(parsed.settings.supabase);
          }
        } else {
          localStorage.setItem('gym_financas_data', content);
        }

        alert('Backup importado com sucesso. A pagina sera recarregada.');
        window.location.reload();
      } catch {
        alert('Arquivo invalido para importacao.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const limparDados = () => {
    try {
      localStorage.removeItem('gym_financas_data');
      setShowClearModal(false);
      window.location.reload();
    } catch {
      alert('Falha ao limpar dados.');
    }
  };

  const statusBadge = useMemo(() => {
    if (supabaseStatus === 'connected') {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300';
    }
    if (supabaseStatus === 'disconnected') {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }, [supabaseStatus]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center gap-3">
            <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pro-labore</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Defina a retirada mensal para separar pessoa fisica e operacao.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Valor mensal</label>
              <input
                type="number"
                min="0"
                step="100"
                value={proLabore}
                onChange={(event) => setProLabore(Math.max(0, Number(event.target.value) || 0))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-emerald-950/40"
              />
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
              {formatCurrency(proLabore)}
            </div>
          </div>

          <button
            type="button"
            onClick={salvarProLabore}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <Save className="h-4 w-4" />
            Salvar pro-labore
          </button>
        </section>

        <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Supabase</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
              {supabaseStatus === 'connected' ? 'Conectado' : supabaseStatus === 'disconnected' ? 'Desconectado' : 'Sem status'}
            </span>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">Conecte o projeto para sincronizacao externa e operacoes em nuvem.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(event) => setSupabaseUrl(event.target.value)}
                placeholder="https://xxxx.supabase.co"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Anon Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(event) => setSupabaseKey(event.target.value)}
                placeholder="chave anon/public"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950/40"
              />
            </div>

            {supabaseMessage && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300">
                {supabaseMessage}
              </p>
            )}

            <button
              type="button"
              onClick={salvarSupabase}
              disabled={supabaseLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Database className="h-4 w-4" />
              {supabaseLoading ? 'Testando conexao...' : 'Salvar e testar conexao'}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gestao de filiais</h3>
          </div>
          <button
            type="button"
            onClick={abrirNovaFilial}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Nova filial
          </button>
        </div>

        {filiais.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhuma filial cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filiais.map((filial) => (
              <article key={filial.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{filial.nome}</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{filial.endereco}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEditarFilial(filial)}
                    className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilialToRemove(filial)}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center gap-3">
            <HardDriveDownload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Backup e restauracao</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Exporte os dados atuais ou importe um backup para recuperar a operacao rapidamente.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportarBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              <Download className="h-4 w-4" />
              Exportar backup
            </button>
            <button
              type="button"
              onClick={() => inputImportRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <HardDriveUpload className="h-4 w-4" />
              Importar backup
            </button>
            <input ref={inputImportRef} type="file" accept="application/json" onChange={importarBackup} className="hidden" />
          </div>
        </section>

        <section className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-6 shadow-sm dark:border-rose-900/30 dark:bg-rose-950/15">
          <div className="mb-5 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-300" />
            <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-200">Zona de seguranca</h3>
          </div>
          <p className="text-sm text-rose-800 dark:text-rose-300">A limpeza remove apenas dados operacionais. Suas configuracoes (pro-labore e Supabase) sao preservadas.</p>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-4 w-4" />
            Limpar dados locais
          </button>
        </section>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/30">
                <Save className="h-7 w-7 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configuracao salva</h4>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pro-labore atualizado com sucesso.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showFilialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(event) => event.target === event.currentTarget && fecharFilialModal()}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editingFilial ? 'Editar filial' : 'Nova filial'}</h4>
              <button
                type="button"
                onClick={fecharFilialModal}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <input
                  type="text"
                  value={filialNome}
                  onChange={(event) => setFilialNome(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-950/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Endereco</label>
                <input
                  type="text"
                  value={filialEndereco}
                  onChange={(event) => setFilialEndereco(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-950/40"
                />
              </div>

              {filialError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
                  {filialError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharFilialModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarFilial}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
              >
                Salvar filial
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(event) => event.target === event.currentTarget && setShowClearModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmar limpeza de dados</h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Esta acao remove os dados locais atuais, mas mantem configuracoes salvas. Use somente quando tiver backup valido.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={limparDados}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
              >
                Limpar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {filialToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(event) => event.target === event.currentTarget && setFilialToRemove(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmar remocao de filial</h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja remover a filial <span className="font-semibold text-slate-700 dark:text-slate-200">{filialToRemove.nome}</span>? Essa acao nao pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFilialToRemove(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => removerFilial(filialToRemove.id)}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
              >
                Remover agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
