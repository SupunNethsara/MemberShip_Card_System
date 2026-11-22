import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, RefreshCw, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import { Alert, Button, Input, PasswordInput, Select } from '../../components/ui';
import { useResendRegisterOtpMutation, useSendRegisterOtpMutation, useVerifyRegisterOtpMutation } from '../../app/api';
import { setCredentials } from '../../app/authSlice';
import { baseApi } from '../../app/baseApi';
import { LOCALES } from '../../app/localeSlice';
import { useDocumentTitle, useT } from '../../hooks';
import { errorMessage, fieldErrors } from '../../lib/format';

export default function RegisterPage() {
  const { t } = useT();
  useDocumentTitle(t('nav.join'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const locale = useSelector((s) => s.locale.current);

  const [sendRegisterOtp, { isLoading: isSending, error: sendError }] = useSendRegisterOtpMutation();
  const [verifyRegisterOtp, { isLoading: isVerifying, error: verifyError }] = useVerifyRegisterOtpMutation();
  const [resendRegisterOtp, { isLoading: isResending, error: resendError }] = useResendRegisterOtpMutation();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    nic: '',
    password: '',
    password_confirmation: '',
    preferred_locale: locale,
  });
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [infoMsg, setInfoMsg] = useState('');

  const sendErrs = fieldErrors(sendError);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setInfoMsg('');
    try {
      const res = await sendRegisterOtp(form).unwrap();
      setCooldown(res.cooldown || 60);
      setStep('otp');
    } catch {
      /* rendered below */
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    try {
      const res = await resendRegisterOtp({ phone: form.phone }).unwrap();
      setCooldown(res.cooldown || 60);
      setInfoMsg(t('auth.codeSent'));
    } catch {
      /* rendered below */
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyRegisterOtp({ phone: form.phone, otp: otp.trim() }).unwrap();
      dispatch(baseApi.util.resetApiState());
      dispatch(setCredentials(res));
      const tier = params.get('tier');
      navigate(tier ? `/portal/checkout?tier=${tier}` : '/portal/checkout', { replace: true });
    } catch {
      /* rendered below */
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
      {step === 'details' ? (
        <>
          <h1 className="text-2xl font-semibold">{t('auth.registerTitle')}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{t('auth.registerSub')}</p>

          <form onSubmit={handleSendOtp} className="surface mt-8 grid gap-4 p-6 sm:grid-cols-2">
            {sendError && !Object.keys(sendErrs).length && (
              <Alert tone="danger" className="sm:col-span-2">
                {errorMessage(sendError)}
              </Alert>
            )}
            <Input
              className="sm:col-span-2"
              label={t('auth.name')}
              required
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              error={sendErrs.name}
            />
            <Input
              label={t('auth.email')}
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={sendErrs.email}
            />
            <Input
              label={t('auth.phone')}
              required
              inputMode="tel"
              placeholder="07X XXX XXXX"
              value={form.phone}
              onChange={set('phone')}
              error={sendErrs.phone}
            />
            <Input label={t('auth.nic')} value={form.nic} onChange={set('nic')} error={sendErrs.nic} />
            <Select
              label={t('auth.language')}
              value={form.preferred_locale}
              onChange={set('preferred_locale')}
              options={LOCALES.map((l) => ({ value: l.code, label: l.name }))}
            />
            <PasswordInput
              label={t('auth.password')}
              required
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={sendErrs.password}
              hint="8+ characters, letters & numbers"
            />
            <PasswordInput
              label={t('auth.confirm')}
              required
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={set('password_confirmation')}
            />
            <Button
              type="submit"
              size="lg"
              className="justify-center sm:col-span-2"
              loading={isSending}
              icon={UserPlus}
            >
              {t('auth.submitRegister')}
            </Button>
            <p className="text-center text-sm text-slate-600 sm:col-span-2">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="font-medium text-navy-900 underline underline-offset-2">
                {t('nav.login')}
              </Link>
            </p>
          </form>
        </>
      ) : (
        <div className="surface mt-8 flex flex-col p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setOtp('');
                setInfoMsg('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-navy-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('auth.editDetails')}</span>
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-800">
              <ShieldCheck className="h-3.5 w-3.5 text-navy-600" />
              SMS OTP
            </span>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-navy-950">{t('auth.otpTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t('auth.otpSub')}{' '}
              <span className="font-semibold text-slate-900">{form.phone}</span>
            </p>
          </div>

          {infoMsg && <Alert tone="success" className="mt-5">{infoMsg}</Alert>}
          {verifyError && <Alert tone="danger" className="mt-5">{errorMessage(verifyError)}</Alert>}
          {resendError && <Alert tone="danger" className="mt-5">{errorMessage(resendError)}</Alert>}

          <form onSubmit={handleVerifyOtp} className="mt-6 flex flex-col gap-4">
            <div>
              <label
                htmlFor="otp-input"
                className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                {t('auth.otpCode')}
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white py-3 text-center font-mono text-3xl font-extrabold tracking-[0.4em] text-navy-950 shadow-sm transition placeholder:text-slate-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
              />
              <p className="mt-1.5 text-center text-xs text-slate-500">{t('auth.otpHint')}</p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 justify-center"
              loading={isVerifying}
              disabled={otp.length < 6}
              icon={ShieldCheck}
            >
              {t('auth.verifySubmit')}
            </Button>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setOtp('');
                  setInfoMsg('');
                }}
                className="text-slate-500 hover:text-navy-900"
              >
                {t('auth.editDetails')}
              </button>

              {cooldown > 0 ? (
                <span className="font-medium text-slate-400">
                  {t('auth.resendIn', { s: cooldown })}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 font-semibold text-gold-600 hover:text-gold-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                  {t('auth.resendCode')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
