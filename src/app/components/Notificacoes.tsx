import React from 'react';
import { CircleAlert, CheckCircle, Bell, BellOff, RotateCcw } from 'lucide-react';
import { NotificationItem } from '../services/notificationService';

interface NotificacoesProps {
  dismissedNotifications: string[];
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (page: string, filter?: string) => void;
  onReopenNotification: (id: string) => void;
  onResetNotifications: () => void;
}

export function Notificacoes({
  dismissedNotifications,
  notifications,
  onDismissNotification,
  onMarkAllAsRead,
  onNavigate,
  onReopenNotification,
  onResetNotifications,
}: NotificacoesProps) {
  const visible = notifications.filter((n) => !dismissedNotifications.includes(n.id));
  const hidden = notifications.filter((n) => dismissedNotifications.includes(n.id));

  const levelConfig = {
    high: {
      border: 'border-rose-200 dark:border-rose-900',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      icon: 'text-rose-500',
      badge: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
      label: 'Crítico',
    },
    medium: {
      border: 'border-amber-200 dark:border-amber-900',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      icon: 'text-amber-500',
      badge: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
      label: 'Atenção',
    },
    info: {
      border: 'border-sky-200 dark:border-sky-900',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      icon: 'text-sky-500',
      badge: 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300',
      label: 'Info',
    },
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Total</p>
          <p className="text-3xl text-gray-900 dark:text-slate-100">{notifications.length}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">notificações geradas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Pendentes</p>
          <p className="text-3xl text-rose-600 dark:text-rose-400">{visible.filter(n => n.level !== 'info').length}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">requerem ação</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Lidas</p>
          <p className="text-3xl text-emerald-600 dark:text-emerald-400">{hidden.length}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">marcadas como lidas</p>
        </div>
      </div>

      {/* Ações globais */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300">
          {visible.length > 0 ? `${visible.length} notificação(ões) ativa(s)` : 'Nenhuma notificação ativa'}
        </h3>
        <div className="flex gap-2">
          {visible.length > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Marcar todas como lidas
            </button>
          )}
          {hidden.length > 0 && (
            <button
              type="button"
              onClick={onResetNotifications}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reabrir todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificações ativas */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map(n => {
            const cfg = levelConfig[n.level];
            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <CircleAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.icon}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{n.title}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{n.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(n.targetPage, n.filter)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
                  >
                    {n.actionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissNotification(n.id)}
                    title="Marcar como lida"
                    className="p-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <BellOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">Nenhuma notificação ativa</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Tudo em dia por aqui.</p>
        </div>
      )}

      {/* Notificações lidas */}
      {hidden.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Lidas</p>
          <div className="space-y-2">
            {hidden.map(n => (
              <div
                key={n.id}
                className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3 opacity-60"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 line-through">{n.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{n.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onReopenNotification(n.id)}
                  className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  Reabrir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
