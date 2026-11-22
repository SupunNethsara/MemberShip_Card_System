import { API_URL } from '../app/baseApi';
import { store } from '../app/store';

/** Downloads an authenticated file (e.g. HTML receipt) and saves it via a temporary object URL. */
export async function downloadAuthenticated(path, filename) {
  const { token } = store.getState().auth;
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    let msg = 'Download failed';
    try { msg = (await res.json()).message || msg; } catch { /* non-JSON */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
