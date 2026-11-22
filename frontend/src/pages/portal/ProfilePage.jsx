import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save } from 'lucide-react';
import { Alert, Button, Card, Input, PageHeader, PasswordInput, Select } from '../../components/ui';
import { useUpdateProfileMutation } from '../../app/api';
import { setUser } from '../../app/authSlice';
import { LOCALES, setLocale } from '../../app/localeSlice';
import { useDocumentTitle, useT, useToast } from '../../hooks';
import { errorMessage, fieldErrors } from '../../lib/format';

export default function ProfilePage() {
  const { t } = useT();
  useDocumentTitle(t('portal.nav.profile'));
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((s) => s.auth.user);
  const [update, { isLoading, error }] = useUpdateProfileMutation();
  const [form, setForm] = useState({ name: '', phone: '', preferred_locale: 'en', current_password: '', password: '', password_confirmation: '' });
  const errs = fieldErrors(error);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name, phone: user.phone || '', preferred_locale: user.preferred_locale }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    const body = { name: form.name, phone: form.phone, preferred_locale: form.preferred_locale };
    if (form.password) Object.assign(body, { current_password: form.current_password, password: form.password, password_confirmation: form.password_confirmation });
    try {
      const res = await update(body).unwrap();
      dispatch(setUser(res.data));
      dispatch(setLocale(form.preferred_locale));
      setForm((f) => ({ ...f, current_password: '', password: '', password_confirmation: '' }));
      toast('Profile updated');
    } catch { /* shown */ }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('portal.nav.profile')} />
      <form onSubmit={submit} className="space-y-6">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label={t('auth.name')} value={form.name} onChange={set('name')} error={errs.name} />
            <Input label={t('auth.email')} value={user?.email || ''} disabled />
            <Input label={t('auth.phone')} value={form.phone} onChange={set('phone')} error={errs.phone} />
            <Input label={t('portal.memberId')} value={user?.member_code || ''} disabled fieldClass="font-mono" />
            <Select label={t('auth.language')} value={form.preferred_locale} onChange={set('preferred_locale')} options={LOCALES.map((l) => ({ value: l.code, label: l.name }))} />
          </div>
        </Card>
        <Card title={t('auth.password')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <PasswordInput label="Current" value={form.current_password} onChange={set('current_password')} error={errs.current_password} autoComplete="current-password" />
            <PasswordInput label="New" value={form.password} onChange={set('password')} error={errs.password} autoComplete="new-password" />
            <PasswordInput label={t('auth.confirm')} value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" />
          </div>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" icon={Save} loading={isLoading}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
