import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LogIn } from 'lucide-react';
import { Alert, Button, Input, PasswordInput } from '../../components/ui';
import { useLoginMutation } from '../../app/api';
import { setCredentials } from '../../app/authSlice';
import { baseApi } from '../../app/baseApi';
import { useDocumentTitle, useT } from '../../hooks';
import { errorMessage } from '../../lib/format';

export default function LoginPage() {
  const { t } = useT();
  useDocumentTitle(t('nav.login'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form).unwrap();
      dispatch(baseApi.util.resetApiState());
      dispatch(setCredentials(res));
      const from = location.state?.from;
      navigate(from && !from.startsWith('/login') ? from : res.user.is_staff ? '/admin' : '/portal', { replace: true });
    } catch { /* error rendered below */ }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold">{t('auth.loginTitle')}</h1>
      <p className="mt-1.5 text-sm text-slate-600">{t('auth.loginSub')}</p>

      <form onSubmit={submit} className="surface mt-8 space-y-4 p-6">
        {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Input label={t('auth.email')} type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput
          label={t('auth.password')}
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          aside={
            <Link to="/forgot-password" className="text-xs text-navy-800 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          }
        />
        <Button type="submit" className="w-full justify-center" size="lg" loading={isLoading} icon={LogIn}>{t('auth.submitLogin')}</Button>
        <p className="text-center text-sm text-slate-600">
          {t('auth.noAccount')} <Link to="/register" className="font-medium text-navy-900 underline underline-offset-2">{t('nav.join')}</Link>
        </p>
      </form>
    </div>
  );
}
