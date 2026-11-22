import { lazy, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Route-chunk loading tracker.
 * The router navigates inside a React transition, so the current page stays on screen while the
 * next page's code downloads (no blank flash). lazyPage() counts those downloads so <RouteProgress />
 * can show the gold top bar meanwhile — the user always sees that something is happening.
 */
let pending = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => pending;

export function lazyPage(factory) {
  return lazy(() => {
    pending += 1;
    emit();
    return factory().finally(() => {
      pending = Math.max(0, pending - 1);
      emit();
    });
  });
}

/** True while any page chunk is downloading (after a short grace period to avoid flicker). */
export function useRouteLoading(graceMs = 120) {
  const count = useSyncExternalStore(subscribe, snapshot);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!count) { setVisible(false); return undefined; }
    const id = setTimeout(() => setVisible(true), graceMs);
    return () => clearTimeout(id);
  }, [count, graceMs]);
  return visible;
}
