import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { Alert, Button, Input, PasswordInput } from '../../components/ui';
import { useResendForgotPasswordOtpMutation, useResetPasswordWithOtpMutation, useSendForgotPasswordOtpMutation } from '../../app/api';
import { setCredentials } from '../../app/authSlice';
import { baseApi } from '../../app/baseApi';
import { useDocumentTitle, useT } from '../../hooks';
import { errorMessage, fieldErrors } from '../../lib/format';
import OtpSentHeader, { resentMessage } from '../../components/public/OtpSentHeader';

export default function ForgotPasswordPage() {
  const { t } = useT();
  useDocumentTitle(t('auth.forgotTitle'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sendForgotOtp, { isLoading: isSending, error: sendError }] = useSendForgotPasswordOtpMutation();
  const [resendForgotOtp, { isLoading: isResending, error: resendError }] = useResendForgotPasswordOtpMutation();
  const [resetPassword, { isLoading: isResetting, error: resetError }] = useResetPasswordWithOtpMutation();

  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [sentTo, setSentTo] = useState({ channel: 'sms', destination: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [infoMsg, setInfoMsg] = useState('');

  const sendErrs = fieldErrors(sendError);
  const resetErrs = fieldErrors(resetError);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setInfoMsg('');
    try {
      const res = await sendForgotOtp({ identifier: identifier.trim() }).unwrap();
      setPhone(res.phone);
      setMaskedPhone(res.masked_phone || res.phone);
      setSentTo({ channel: res.channel, destination: res.destination });
      setCooldown(res.cooldown || 60);
      setStep('reset');
    } catch {
      /* handled by sendError */
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    try {
      const res = await resendForgotOtp({ phone }).unwrap();
      setSentTo({ channel: res.channel, destination: res.destination });
      setCooldown(res.cooldown || 60);
      setInfoMsg(resentMessage(t, res.channel));
    } catch {
      /* handled by resendError */
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await resetPassword({
        phone,
        otp: otp.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      }).unwrap();

      dispatch(baseApi.util.resetApiState());
      dispatch(setCredentials(res));
      navigate('/portal', { replace: true });
    } catch {
      /* handled by resetError */
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      {step === 'request' ? (
        <>
          <h1 className="text-2xl font-semibold">{t('auth.forgotTitle')}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{t('auth.forgotSub')}</p>

          <form onSubmit={handleSendCode} className="surface mt-8 space-y-4 p-6">
            {sendError && !Object.keys(sendErrs).length && (
              <Alert tone="danger">{errorMessage(sendError)}</Alert>
            )}

            <Input
              label={t('auth.identifier')}
              required
              autoFocus
              placeholder="e.g. 0771234567 or email@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={sendErrs.identifier}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full justify-center"
              loading={isSending}
              icon={KeyRound}
            >
              {t('auth.sendResetCode')}
            </Button>

            <p className="text-center text-sm text-slate-600">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-navy-900 underline underline-offset-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('auth.backToLogin')}
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
                setStep('request');
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
              OTP Reset
            </span>
          </div>

          <OtpSentHeader channel={sentTo.channel} destination={sentTo.destination || maskedPhone} />

          {infoMsg && <Alert tone="success" className="mt-5">{infoMsg}</Alert>}
          {resetError && !Object.keys(resetErrs).length && (
            <Alert tone="danger" className="mt-5">{errorMessage(resetError)}</Alert>
          )}
          {resendError && <Alert tone="danger" className="mt-5">{errorMessage(resendError)}</Alert>}

          <form onSubmit={handleResetSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label
                htmlFor="otp-input"
                className="block text-center text-sm font-medium text-slate-700"
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
                className="mt-2 w-full rounded-md border border-slate-300 bg-white py-2.5 text-center font-mono text-2xl font-semibold tracking-[0.35em] text-navy-950 placeholder:text-slate-300 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
              {resetErrs.otp && (
                <p className="mt-1 text-center text-xs text-rose-600">{resetErrs.otp}</p>
              )}
            </div>

            <PasswordInput
              label={t('auth.newPassword')}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={resetErrs.password}
              hint="8+ characters, letters & numbers"
            />

            <PasswordInput
              label={t('auth.confirmNewPassword')}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              size="lg"
              className="mt-2 justify-center"
              loading={isResetting}
              disabled={otp.length < 6 || !newPassword}
              icon={ShieldCheck}
            >
              {t('auth.resetPassword')}
            </Button>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
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
