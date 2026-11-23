import { Mail, Smartphone } from 'lucide-react';
import { useT } from '../../hooks';

/**
 * Heading for the "enter your code" step. The backend reports where the code went
 * (`channel`: 'sms' | 'email', `destination`: masked phone/email) — email is used until a real SMS gateway is set up.
 */
export default function OtpSentHeader({ channel = 'sms', destination }) {
  const { t } = useT();
  const email = channel === 'email';
  const Glyph = email ? Mail : Smartphone;

  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
        <Glyph className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-navy-950">{t(email ? 'auth.otpTitleEmail' : 'auth.otpTitle')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t(email ? 'auth.otpSubEmail' : 'auth.otpSub')}{' '}
        <span className="font-semibold text-slate-900">{destination}</span>
      </p>
      {email && <p className="mt-1 text-xs text-slate-500">{t('auth.otpSpamHint')}</p>}
    </div>
  );
}

/** Message for a successful "resend code". */
export const resentMessage = (t, channel) => t(channel === 'email' ? 'auth.codeSentEmail' : 'auth.codeSent');
