import { usePermission } from '../../hooks';

/**
 * Declarative permission wrapper.
 *   <Can perform="gateways.payment.manage"> ... </Can>
 *   <Can perform={['offers.manage', 'partners.manage']} fallback={<ReadOnlyNote />}> ... </Can>
 * Accepts a slug, "a|b" (any-of), or an array (any-of). Children may be a render function: (allowed) => node.
 */
export default function Can({ perform, children, fallback = null }) {
  const can = usePermission();
  const allowed = can(perform);
  if (typeof children === 'function') return children(allowed);
  return allowed ? children : fallback;
}
