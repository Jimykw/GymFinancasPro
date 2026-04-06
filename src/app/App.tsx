import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Alunos } from './components/Alunos';
import { Despesas } from './components/Despesas';
import { FluxoCaixa } from './components/FluxoCaixa';
import { Relatorios } from './components/Relatorios';
import { Configuracoes } from './components/Configuracoes';
import { Notificacoes } from './components/Notificacoes';
import { Toaster } from './components/ui/sonner';
import { getNotifications } from './services/notificationService';

const DISMISSED_NOTIFICATIONS_STORAGE_KEY = 'gym_financas_dismissed_notifications';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageFilter, setPageFilter] = useState<string | undefined>(undefined);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const notifications = useMemo(() => getNotifications(), [currentPage]);

  useEffect(() => {
    setDismissedNotifications((current) => current.filter((id) => notifications.some((item) => item.id === id)));
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(dismissedNotifications));
    } catch {
      // Ignore storage persistence failures.
    }
  }, [dismissedNotifications]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleNavigate = (page: string, filter?: string) => {
    setCurrentPage(page);
    setPageFilter(filter);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'alunos':
        return <Alunos initialFilter={pageFilter as any} />;
      case 'despesas':
        return <Despesas initialFilter={pageFilter as any} />;
      case 'fluxo':
        return <FluxoCaixa />;
      case 'relatorios':
        return <Relatorios />;
      case 'notificacoes':
        return (
          <Notificacoes
            dismissedNotifications={dismissedNotifications}
            notifications={notifications}
            onDismissNotification={(id) => setDismissedNotifications((current) => [...new Set([...current, id])])}
            onMarkAllAsRead={() => setDismissedNotifications(notifications.map((item) => item.id))}
            onNavigate={handleNavigate}
            onReopenNotification={(id) => setDismissedNotifications((current) => current.filter((item) => item !== id))}
            onResetNotifications={() => setDismissedNotifications([])}
          />
        );
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      dismissedNotifications={dismissedNotifications}
      notifications={notifications}
      onDismissNotification={(id) => setDismissedNotifications((current) => [...new Set([...current, id])])}
      onMarkAllAsRead={() => setDismissedNotifications(notifications.map((item) => item.id))}
      onNavigate={handleNavigate}
      onResetNotifications={() => setDismissedNotifications([])}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}