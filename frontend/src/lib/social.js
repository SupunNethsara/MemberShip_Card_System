import { Facebook, Instagram, Linkedin, MessageCircle, Music2, Twitter, Youtube } from 'lucide-react';

/** Social platforms shown in the footer and editable in Admin › CMS › Site settings. */
export const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', label: 'TikTok', icon: Music2, placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'x', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/yourhandle' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+94 77 123 4567', isNumber: true },
];

/** Public link for a platform value (WhatsApp numbers become wa.me links). */
export const socialHref = (key, value) => {
  if (!value) return null;
  if (key === 'whatsapp') return `https://wa.me/${String(value).replace(/\D/g, '')}`;
  return value;
};
