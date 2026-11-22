/** lucide-react wrapper that enforces the design-system stroke width (1.75). */
export default function Icon({ icon: Glyph, size = 16, className = '', ...rest }) {
  if (!Glyph) return null;
  return <Glyph size={size} strokeWidth={1.75} className={className} aria-hidden="true" {...rest} />;
}
