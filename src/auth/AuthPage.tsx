import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { api, ApiError } from './api';
import { useAuthMessages } from './messages';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { useTheme } from '../hooks/useTheme';
import { useLifeLanguage } from '../lifeI18n';
import { AuthFeatures, AuthShowcase } from './AuthShowcase';
import { staticPreview } from '../config';
type Mode = 'login' | 'register' | 'forgot' | 'reset';
const resetToken = () =>
  location.hash.startsWith('#reset-password?')
    ? (new URLSearchParams(location.hash.split('?')[1]).get('token') ?? '')
    : '';
export function AuthPage() {
  const auth = useAuth();
  const text = useAuthMessages();
  const { l } = useLifeLanguage();
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = useState<Mode>(() =>
    location.hash.startsWith('#reset-password') ? 'reset' : 'login',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  useEffect(() => {
    document.title = `365. · ${mode === 'login' ? text.login : mode === 'register' ? text.register : text.recoveryTitle}`;
  }, [mode, text]);
  useEffect(() => {
    const handler = () => {
      if (location.hash.startsWith('#reset-password')) {
        setMode('reset');
        setError('');
        setNotice('');
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  function change(next: Mode) {
    setError('');
    setNotice('');
    setVisible(false);
    setMode(next);
    if (next === 'login' && location.hash.startsWith('#reset-password')) {
      history.replaceState(null, '', `${location.pathname}${location.search}#Today`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || staticPreview) return;
    setError('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    if ((mode === 'register' || mode === 'reset') && password !== data.get('confirm')) {
      setError(text.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') await auth.register(String(data.get('name') ?? ''), email, password);
      else if (mode === 'login') await auth.login(email, password, remember);
      else if (mode === 'forgot') {
        const result = await api<{ delivery: 'email' | 'local' }>('/api/auth/forgot-password', {
          method: 'POST',
          body: { email },
        });
        setNotice(result.delivery === 'local' ? text.resetLocal : text.resetSent);
      } else {
        await api('/api/auth/reset-password', {
          method: 'POST',
          body: { token: resetToken(), password },
        });
        await auth.refresh();
        setNotice(text.resetSuccess);
      }
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'server_error';
      if (code === 'confirmation_required') setNotice(text.confirmation_required);
      else setError(code in text ? text[code as keyof typeof text] : text.server_error);
    } finally {
      setBusy(false);
    }
  }
  const words = text.title.split(' ');
  const accent = words.pop();
  const heading =
    mode === 'login' ? text.welcome : mode === 'register' ? text.start : text.recoveryTitle;
  return (
    <main className="auth-layout auth-premium">
      <section className="auth-intro">
        <div className="auth-orbit auth-orbit-top" />
        <div className="auth-orbit auth-orbit-bottom" />
        <a className="auth-wordmark" href="#">
          365<span>.</span>
        </a>
        <div className="auth-intro-copy">
          <p className="auth-eyebrow">{text.subtitle}</p>
          <h1>
            {words.join(' ')} <span>{accent}</span>
          </h1>
          <p className="auth-description">{text.subtitle}</p>
          <AuthFeatures />
        </div>
        <AuthShowcase />
      </section>
      <section className="auth-panel">
        <div className="auth-tools">
          <div className="auth-theme-switch" role="group" aria-label={l.appearance}>
            <button
              type="button"
              aria-label={l.light}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
            >
              <Sun size={19} />
            </button>
            <button
              type="button"
              aria-label={l.dark}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
            >
              <Moon size={18} />
            </button>
          </div>
          <LanguageDropdown />
        </div>
        <div className={`auth-form-wrap auth-card auth-mode-${mode}`}>
          <h2>{heading}</h2>
          {staticPreview && (
            <p className="auth-static-notice" role="note">
              {text.staticPreview}{' '}
              <a href="https://github.com/delivery12335/365.---life-management#быстрый-старт">
                {text.sourceCode}
              </a>
            </p>
          )}
          {mode === 'register' && <p className="auth-register-hint">{text.registrationHint}</p>}
          {(mode === 'forgot' || mode === 'reset') && !notice && (
            <p className="auth-register-hint">
              {mode === 'forgot' ? text.recoveryHint : text.passwordHint}
            </p>
          )}
          {notice ? (
            <div className="auth-recovery-result" role="status">
              <span>
                <Check size={24} />
              </span>
              <p>{notice}</p>
              <button className="button secondary" onClick={() => change('login')}>
                <ArrowLeft size={16} />
                {text.backToLogin}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form" key={mode}>
              {mode === 'register' && (
                <label>
                  {text.name}
                  <span className="auth-input-wrap">
                    <UserRound size={19} />
                    <input
                      name="name"
                      autoComplete="name"
                      maxLength={40}
                      required
                      disabled={busy || staticPreview}
                    />
                  </span>
                </label>
              )}
              {mode !== 'reset' && (
                <label>
                  {text.email}
                  <span className="auth-input-wrap">
                    <Mail size={20} />
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={busy || staticPreview}
                    />
                  </span>
                </label>
              )}
              {mode !== 'forgot' && (
                <label>
                  {mode === 'reset' ? text.newPassword : text.password}
                  <span className="auth-input-wrap">
                    <LockKeyhole size={19} />
                    <input
                      name="password"
                      type={visible ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={mode === 'login' ? undefined : 10}
                      maxLength={128}
                      required
                      disabled={busy || staticPreview}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={visible ? text.hidePassword : text.showPassword}
                      onClick={() => setVisible((value) => !value)}
                    >
                      {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </span>
                  {mode === 'register' && <small>{text.passwordHint}</small>}
                </label>
              )}
              {(mode === 'register' || mode === 'reset') && (
                <label>
                  {text.confirmPassword}
                  <span className="auth-input-wrap">
                    <LockKeyhole size={19} />
                    <input
                      name="confirm"
                      type={visible ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={10}
                      maxLength={128}
                      required
                      disabled={busy || staticPreview}
                    />
                  </span>
                </label>
              )}
              {mode === 'login' && (
                <div className="auth-form-options">
                  <label className="auth-remember">
                    <span>
                      <input
                        type="checkbox"
                        name="remember"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        disabled={busy || staticPreview}
                      />
                      <Check size={13} />
                    </span>
                    {text.remember}
                  </label>
                  <button
                    type="button"
                    className="auth-forgot"
                    disabled={busy || staticPreview}
                    onClick={() => change('forgot')}
                  >
                    {text.forgot}
                  </button>
                </div>
              )}
              {error && (
                <p role="alert" className="auth-error">
                  {error}
                </p>
              )}
              <button className="button primary auth-submit" disabled={busy || staticPreview}>
                {busy ? (
                  <span className="loading-spinner" />
                ) : mode === 'login' ? (
                  text.login
                ) : mode === 'register' ? (
                  text.register
                ) : mode === 'forgot' ? (
                  text.sendLink
                ) : (
                  text.savePassword
                )}
                {!busy && <ArrowRight size={18} />}
              </button>
            </form>
          )}
          {mode === 'login' || mode === 'register' ? (
            <div className="auth-switch">
              <span>{mode === 'login' ? text.noAccount : text.hasAccount}</span>
              <button
                disabled={busy || staticPreview}
                onClick={() => change(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? text.register : text.login}
              </button>
            </div>
          ) : (
            !notice && (
              <button
                className="auth-back"
                disabled={busy || staticPreview}
                onClick={() => change('login')}
              >
                <ArrowLeft size={15} />
                {text.backToLogin}
              </button>
            )
          )}
        </div>
      </section>
    </main>
  );
}
export function AuthLoading({ error = false, retry }: { error?: boolean; retry?: () => void }) {
  const text = useAuthMessages();
  return (
    <div className="auth-loading">
      <strong>365.</strong>
      {error ? (
        <>
          <h2>{text.connectionTitle}</h2>
          <p>{text.connectionHint}</p>
          <button className="button secondary" onClick={retry}>
            {text.retry}
          </button>
        </>
      ) : (
        <>
          <span className="loading-spinner" />
          <p>{text.loading}</p>
        </>
      )}
    </div>
  );
}
