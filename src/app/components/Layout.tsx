import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { changePasswordApi } from '../services/apiClient';
import {
  Bell,
  CheckCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  Dumbbell,
  Settings,
  CreditCard,
  Download,
  Plus,
  UserPlus,
  Camera,
} from 'lucide-react';
import { NotificationItem } from '../services/notificationService';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  dismissedNotifications: string[];
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (page: string, filter?: string) => void;
  onResetNotifications: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface PageHeaderConfig {
  badge: string;
  title: string;
  description: string;
}

export function Layout({
  children,
  currentPage,
  dismissedNotifications,
  notifications,
  onDismissNotification,
  onMarkAllAsRead,
  onNavigate,
  onResetNotifications,
}: LayoutProps) {
  const { user, logout, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fluxoPeriodoAtivo, setFluxoPeriodoAtivo] = useState<'3' | '6' | '12'>('6');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gym_financas_theme');

    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      return;
    }

    setDarkMode(false);
    document.documentElement.classList.remove('dark');
    localStorage.setItem('gym_financas_theme', 'light');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 0) {
        setSidebarCollapsed(false);
      } else if (y > lastScrollY.current && y > 80) {
        setSidebarCollapsed(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!profileModalOpen) {
      setProfileName(user?.name ?? '');
      setProfileEmail(user?.email ?? '');
      setProfilePhoto(user?.avatarUrl ?? null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError('');
      setPasswordSuccess('');
      setProfileSaveError('');
    }
  }, [profileModalOpen, user]);

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileSaveError('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileSaveError('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(String(reader.result || ''));
      setProfileSaveError('');
      if (event.target) {
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileSaveError('');

    if (!profileName.trim()) {
      setProfileSaveError('Informe seu nome.');
      return;
    }

    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      setProfileSaveError('Informe um e-mail válido.');
      return;
    }

    try {
      setProfileSaveLoading(true);
      const ok = await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        avatarUrl: profilePhoto,
      });

      if (!ok) {
        setProfileSaveError('Sessão inválida. Faça login novamente.');
        return;
      }

      toast.custom(
        () => (
          <div className="w-[min(92vw,560px)] rounded-[30px] border border-slate-200 bg-white px-6 py-5 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <CircleCheck className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="text-[33px] font-semibold leading-[1.08] text-slate-900 dark:text-slate-100">Perfil atualizado com sucesso</p>
                <p className="mt-2 text-[18px] leading-snug text-slate-500 dark:text-slate-400">Suas alterações foram salvas no sistema.</p>
              </div>
            </div>
          </div>
        ),
        { duration: 2000 },
      );
    } catch (error: any) {
      const raw = String(error?.message || 'Erro ao salvar perfil');
      if (raw.includes('E-mail já cadastrado')) {
        setProfileSaveError('Esse e-mail já está em uso por outra conta.');
      } else if (raw.includes('E-mail inválido')) {
        setProfileSaveError('Informe um e-mail válido.');
      } else {
        setProfileSaveError('Não foi possível salvar o perfil agora.');
      }
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('gym_financas_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'alunos', label: 'Alunos & Receitas', icon: Users },
    { id: 'despesas', label: 'Contas a Pagar', icon: CreditCard },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    });
  }

  const pageHeaders: Record<string, PageHeaderConfig> = {
    dashboard: {
      badge: 'Painel financeiro',
      title: 'Visao da academia em um so painel.',
      description: 'Acompanhe saude financeira, metas e alertas para decidir com velocidade.',
    },
    alunos: {
      badge: 'Alunos e receitas',
      title: 'Gestao comercial e recebimentos lado a lado.',
      description: 'Controle matriculas, acompanhe inadimplencia e monitore a entrada de caixa.',
    },
    despesas: {
      badge: 'Contas a pagar',
      title: 'Despesas sob controle para proteger a margem.',
      description: 'Registre vencimentos, priorize pagamentos e reduza riscos de atraso.',
    },
    fluxo: {
      badge: 'Fluxo de caixa',
      title: 'Planejamento diario para manter previsibilidade.',
      description: 'Visualize entradas e saidas para antecipar cenarios e agir com seguranca.',
    },
    relatorios: {
      badge: 'Relatorios executivos',
      title: 'Indicadores claros para decisao de crescimento.',
      description: 'Consolide resultados e encontre oportunidades com leituras rapidas.',
    },
    notificacoes: {
      badge: 'Central de notificações',
      title: 'Alertas e ações em um só lugar.',
      description: 'Acompanhe inadimplência, contas a pagar e alertas financeiros com ações diretas.',
    },
    configuracoes: {
      badge: 'Painel de configuracoes',
      title: 'Governanca, backup e integracoes em um so lugar.',
      description: 'Ajuste pro-labore, mantenha filiais organizadas, configure Supabase e preserve os dados com rotinas de backup e restauracao.',
    },
  };

  const activeHeader = pageHeaders[currentPage] ?? pageHeaders.dashboard;

  const handleExportarRelatoriosPDF = () => {
    window.dispatchEvent(new Event('gymfinancas:export-relatorios-pdf'));
  };

  const handleExportarRelatoriosExcel = () => {
    window.dispatchEvent(new Event('gymfinancas:export-relatorios-excel'));
  };

  const handleAbrirNovoAluno = () => {
    window.dispatchEvent(new Event('gymfinancas:open-add-aluno'));
  };

  const handleAbrirNovaDespesa = () => {
    window.dispatchEvent(new Event('gymfinancas:open-add-despesa'));
  };

  const handleFluxoPeriodo = (periodo: '3' | '6' | '12') => {
    setFluxoPeriodoAtivo(periodo);
    window.dispatchEvent(new CustomEvent('gymfinancas:set-fluxo-periodo', { detail: periodo }));
  };

  const headerActionButtonClass =
    'inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20';

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordError('Preencha todos os campos de senha.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    const token = localStorage.getItem('gym_token');
    if (!token) {
      setPasswordError('Sessão inválida. Faça login novamente.');
      return;
    }

    try {
      setPasswordLoading(true);
      const resp = await changePasswordApi(token, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess(resp.message || 'Senha atualizada com sucesso.');
    } catch (error: any) {
      const raw = String(error?.message || 'Erro ao atualizar senha');
      let msg = 'Erro ao atualizar senha';
      if (raw.includes('Senha atual inválida')) msg = 'Senha atual inválida.';
      else if (raw.includes('deve ser diferente')) msg = 'A nova senha deve ser diferente da atual.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const visibleNotifications = notifications.filter((item) => !dismissedNotifications.includes(item.id));
  const notificationCount = visibleNotifications.filter((item) => item.level !== 'info').length;

  const openNotificationAction = (notification: NotificationItem) => {
    onNavigate(notification.targetPage, notification.filter);
    onDismissNotification(notification.id);
  };

  const markAllAsRead = () => {
    onMarkAllAsRead();
  };

  const resetNotifications = () => {
    onResetNotifications();
  };

  const dismissNotification = (id: string) => {
    onDismissNotification(id);
  };

  return (
    <div className="app-shell min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="sticky top-0 z-30 h-16 bg-slate-900/98 backdrop-blur-md text-white border-b border-white/5 shadow-xl">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">GymFinanças</h1>
              <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase leading-none mt-0.5">Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative rounded-xl p-2.5 transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
                title="Notificacoes"
                aria-label="Notificacoes"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed right-4 top-16 z-[60] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notificacoes</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Acoes rapidas de acompanhamento</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      >
                        <CheckCheck className="mr-1 inline h-3.5 w-3.5" />
                        Marcar lidas
                      </button>
                      <button
                        type="button"
                        onClick={resetNotifications}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Reabrir
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-3">
                    {visibleNotifications.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Sem notificacoes ativas.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                          >
                            <div className="mb-2 flex items-start gap-2">
                              <CircleAlert
                                className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                                  notification.level === 'high'
                                    ? 'text-rose-500'
                                    : notification.level === 'medium'
                                      ? 'text-amber-500'
                                      : 'text-sky-500'
                                }`}
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openNotificationAction(notification)}
                              className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                            >
                              {notification.actionLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissNotification(notification.id)}
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Marcar como lida
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
              title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="hidden sm:flex items-center gap-2.5 border-l border-white/10 pl-3 rounded-xl px-2 py-1 hover:bg-white/10 transition-colors"
              title="Editar perfil"
              aria-label="Editar perfil"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Foto de perfil"
                  className="h-8 w-8 flex-shrink-0 rounded-full object-cover shadow"
                />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-bold text-white shadow">
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium leading-none text-white">{user?.name ?? 'Usuário'}</p>
                <p className="mt-0.5 text-[10px] leading-none text-slate-400">
                  {user?.role === 'admin' ? 'Administrador' : 'Funcionário'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2.5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl transition-all hover:scale-105 active:scale-95"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={[
            'fixed lg:sticky lg:top-16 lg:self-start inset-y-0 left-0 z-40',
            'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl lg:shadow-none',
            'flex flex-col overflow-hidden transition-all duration-300 ease-in-out',
            'mt-16 lg:mt-0 h-[calc(100vh-4rem)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            (sidebarCollapsed && !sidebarHovered) ? 'lg:w-14 w-64' : 'w-64',
          ].join(' ')}
        >
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5 pt-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={[
                    'group w-full flex items-center rounded-xl transition-all duration-200 text-left text-sm font-medium',
                    (sidebarCollapsed && !sidebarHovered) ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100',
                    !isActive && !sidebarCollapsed ? 'hover:translate-x-0.5' : '',
                  ].join(' ')}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200${isActive ? '' : ' group-hover:scale-110'}`} />
                  {!(sidebarCollapsed && !sidebarHovered) && (
                    <span className="truncate transition-all duration-200">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Toggle collapse button */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-2">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? 'Expandir menu' : 'Minimizar menu'}
              className="group w-full flex items-center justify-center rounded-xl py-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
            >
              {sidebarCollapsed
                ? <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                : <><ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" /><span className="ml-2 text-xs font-medium">Minimizar</span></>}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-4rem)]">
          <div className="space-y-6 w-full">
            <section className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_52%,#14b8a6_100%)] p-6 text-white shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#0f766e_100%)] lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    {activeHeader.badge}
                  </span>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">{activeHeader.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm text-emerald-50/90 lg:text-base">{activeHeader.description}</p>
                </div>

                {currentPage === 'relatorios' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExportarRelatoriosPDF}
                      className={headerActionButtonClass}
                    >
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleExportarRelatoriosExcel}
                      className={headerActionButtonClass}
                    >
                      <Download className="h-4 w-4" />
                      Exportar Excel
                    </button>
                  </div>
                )}

                {currentPage === 'alunos' && (
                  <button
                    type="button"
                    onClick={handleAbrirNovoAluno}
                    className={headerActionButtonClass}
                  >
                    <UserPlus className="h-4 w-4" />
                    Novo Aluno
                  </button>
                )}

                {currentPage === 'despesas' && (
                  <button
                    type="button"
                    onClick={handleAbrirNovaDespesa}
                    className={headerActionButtonClass}
                  >
                    <Plus className="h-4 w-4" />
                    Nova Despesa
                  </button>
                )}

                {currentPage === 'fluxo' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Periodo</span>
                    {(['3', '6', '12'] as const).map((periodo) => (
                      <button
                        key={periodo}
                        type="button"
                        onClick={() => handleFluxoPeriodo(periodo)}
                        className={[
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                          fluxoPeriodoAtivo === periodo
                            ? 'border border-white/70 bg-white text-slate-900'
                            : 'border border-white/30 bg-white/10 text-white hover:bg-white/20',
                        ].join(' ')}
                      >
                        <Calendar className="h-4 w-4" />
                        {periodo} meses
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </section>

            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {notificationsOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setNotificationsOpen(false)}
          aria-hidden="true"
        />
      )}

      {profileModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setProfileModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Editar Perfil</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atualize seus dados de perfil no sistema.</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Pré-visualização da foto"
                    className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white">
                    {(profileName || user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="profile-photo-input"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Camera className="h-4 w-4" />
                      Mudar foto
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!profilePhoto) {
                          setProfileSaveError('Nenhuma foto cadastrada para remover.');
                          return;
                        }

                        setProfilePhoto(null);
                        setProfileSaveError('');
                        if (profilePhotoInputRef.current) {
                          profilePhotoInputRef.current.value = '';
                        }
                      }}
                      className="inline-flex items-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/20"
                    >
                      Excluir foto
                    </button>
                  </div>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={profilePhotoInputRef}
                    onChange={handleProfilePhotoChange}
                  />
                  <p className="mt-1 text-xs text-slate-400">PNG/JPG até 2MB.</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="voce@exemplo.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Perfil</label>
                <input
                  type="text"
                  value={user?.role === 'admin' ? 'Administrador' : 'Funcionário'}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                />
              </div>

              <div className="mt-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Trocar Senha</p>
                <div className="mt-3 space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Senha atual"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Nova senha"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Confirmar nova senha"
                  />
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? 'Atualizando...' : 'Atualizar senha'}
                  </button>
                </div>
              </div>

              {passwordError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {passwordSuccess}
                </p>
              )}
              {profileSaveError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {profileSaveError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileSaveLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {profileSaveLoading ? 'Salvando...' : 'Salvar perfil'}
              </button>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
