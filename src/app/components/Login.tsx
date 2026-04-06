import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { forgotPasswordApi } from '../services/apiClient';
import { Dumbbell, Lock, User } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK do Google'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Fake login state
  const FAKE_USER = 'admin';
  const FAKE_PASS = 'admin123';
  // const { login, register, registerWithGoogle } = useAuth();

  const resetStatusMessages = () => {
    setError('');
    setForgotMessage('');
    setForgotError('');
  };

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (username.trim() === FAKE_USER && password === FAKE_PASS) {
        // Simula login bem-sucedido: salva flag no localStorage e recarrega
        localStorage.setItem('fake_logged_in', '1');
        window.location.reload();
      } else {
        setError('Usuário ou senha incorretos');
        setLoading(false);
      }
    }, 700);
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validação simples fake
    if (!registerName.trim() || !registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setError('Preencha nome, usuário, e-mail e senha.');
      return;
    }
    if (!registerEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (registerPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simula cadastro bem-sucedido: salva flag no localStorage e recarrega
      localStorage.setItem('fake_logged_in', '1');
      window.location.reload();
    }, 900);
  };

  const handleGoogleAuth = () => {
    setError('');
    setGoogleLoading(true);
    setTimeout(() => {
      // Simula login Google: salva flag no localStorage e recarrega
      localStorage.setItem('fake_logged_in', '1');
      setGoogleLoading(false);
      window.location.reload();
    }, 900);
  };

  const handleForgotPassword = () => {
    setForgotMessage('');
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail para solicitar redefinição de senha');
      return;
    }
    if (!forgotEmail.includes('@')) {
      setForgotError('Informe um e-mail válido');
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      setForgotMessage('Se o e-mail estiver cadastrado, você receberá instruções de recuperação. (Simulação)');
      setForgotEmail('');
      setResetLoading(false);
    }, 1200);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.35),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(37,99,235,0.35),transparent_40%),linear-gradient(135deg,#0f766e_0%,#0f172a_52%,#2563eb_100%)] p-1 sm:p-3">
      <style>{`
        @keyframes login-fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-enter {
          animation: login-fade-up 0.45s ease-out both;
        }

        .login-enter-delay {
          animation-delay: 0.08s;
        }

        @media (max-height: 820px) and (min-width: 1024px) {
          .login-card {
            border-radius: 18px;
          }

          .login-left-panel {
            padding: 1.25rem;
          }

          .login-right-panel {
            padding: 0.85rem 1rem;
          }

          .login-brand-icon {
            width: 2.75rem;
            height: 2.75rem;
            margin-bottom: 0.5rem;
          }

          .login-title {
            font-size: 1.9rem;
            line-height: 1.05;
          }

          .login-tabs {
            margin-top: 0.6rem;
          }

          .login-form {
            margin-top: 0.55rem;
          }

          .login-fields {
            gap: 0.5rem;
            padding-bottom: 0;
          }

          .login-fields label {
            margin-bottom: 0.35rem;
          }

          .login-fields input {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }

          .login-left-safe {
            display: none;
          }

          .login-actions {
            margin-top: 0.5rem;
            gap: 0.45rem;
          }

          .login-actions button,
          .login-forgot button {
            padding-top: 0.6rem;
            padding-bottom: 0.6rem;
          }

          .login-subtitle {
            margin-top: 0.15rem;
          }
        }
      `}</style>

      <div className="mx-auto h-full w-full max-w-6xl">
        <div className="login-card relative mx-auto h-full w-full max-w-5xl overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-[0_20px_80px_-20px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:rounded-[24px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            <div className="login-left-panel hidden lg:flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#042f2e_0%,#0f766e_55%,#0ea5a4_100%)] p-8 text-white xl:p-10">
              <div className="login-enter">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
                  GymFinanças Pro
                </div>
                <h1 className="mt-6 text-4xl leading-tight text-white">
                  Gestão financeira com clareza para cada decisão.
                </h1>
                <p className="mt-4 max-w-md text-sm text-emerald-50/90">
                  Controle receitas, despesas e inadimplência em uma experiência unificada, rápida e confiável.
                </p>
              </div>

              <div className="login-left-safe login-enter login-enter-delay rounded-2xl border border-white/25 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-widest text-emerald-100/80">Ambiente seguro</p>
                <p className="mt-2 text-sm text-emerald-50/95">
                  Sessão protegida e sincronização dos dados financeiros em tempo real.
                </p>
              </div>
            </div>

            <div className="login-right-panel overflow-hidden bg-white/95 p-5 sm:p-7 lg:p-8 xl:p-10">
              <div className="login-enter text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 lg:justify-start">
                  <div className="login-brand-icon mx-auto lg:mx-0 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                    <Dumbbell className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="login-title text-4xl tracking-tight text-slate-900">{mode === 'login' ? 'Entrar' : 'Cadastrar'}</h2>
                </div>
                <p className="login-subtitle text-slate-500 mt-1.5">
                  {mode === 'login' ? 'Acesse sua conta para continuar' : 'Crie sua conta para começar'}
                </p>
              </div>

              <div className="login-tabs mt-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetStatusMessages();
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setShowForgotPassword(false);
                    resetStatusMessages();
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cadastrar
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="login-form mt-6 login-enter login-enter-delay">
                  <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
                    <p className="font-semibold">Acesso de teste</p>
                    <p>
                      Usuário: <strong>admin</strong>
                    </p>
                    <p>
                      Senha: <strong>admin123</strong>
                    </p>
                  </div>

                  <div className="login-fields space-y-4">
                  <div>
                    <label className="block text-slate-700 mb-2.5">Usuário</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Digite seu usuário"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2.5">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Digite sua senha"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  <div className="pt-1 text-right">
                    <button
                      type="button"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      onClick={() => {
                        setShowForgotPassword((prev) => !prev);
                        setForgotMessage('');
                        setForgotError('');
                      }}
                    >
                      {showForgotPassword ? 'Voltar ao login' : 'Esqueceu sua senha?'}
                    </button>
                  </div>
                  </div>

                  {showForgotPassword && (
                    <div className="login-forgot mt-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                      <h3 className="text-base font-semibold text-emerald-700 mb-3">Redefinição de senha</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 mb-2">E-mail</label>
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                            placeholder="Digite seu e-mail"
                          />
                        </div>

                        {forgotError && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {forgotError}
                          </div>
                        )}

                        {forgotMessage && (
                          <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
                            {forgotMessage}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                          disabled={resetLoading}
                        >
                          {resetLoading ? 'Enviando...' : 'Solicitar redefinição'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="login-actions mt-4 space-y-3">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      disabled={loading}
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={googleLoading}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {googleLoading ? 'Conectando com Google...' : 'Entrar com Google'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="login-form mt-6 login-enter login-enter-delay">
                  <div className="login-fields space-y-4">
                  <div>
                    <label className="block text-slate-700 mb-2.5">Nome</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2.5">Usuário</label>
                    <input
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Escolha um usuário"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2.5">E-mail</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                      placeholder="voce@exemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2.5">Senha</label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-2.5">Confirmar senha</label>
                    <input
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/80 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Repita sua senha"
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}
                  </div>

                  <div className="login-actions mt-4 space-y-3">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      disabled={loading}
                    >
                      {loading ? 'Cadastrando...' : 'Criar conta'}
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={googleLoading}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {googleLoading ? 'Conectando com Google...' : 'Cadastrar com Google'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
