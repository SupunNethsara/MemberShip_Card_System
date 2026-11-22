import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

export const getEcho = (token) => {
  const authToken = token || localStorage.getItem('mp_token');
  const appKey = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
  const port = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : 8080;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
  const apiBase = import.meta.env.VITE_API_URL || '';

  if (!appKey) {
    return null;
  }

  if (echoInstance && echoInstance.__token === authToken) {
    return echoInstance;
  }

  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
  }

  if (!authToken) {
    return null;
  }

  try {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: appKey,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${apiBase}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      },
    });

    echoInstance.__token = authToken;
    return echoInstance;
  } catch (err) {
    console.warn('Could not initialize Laravel Echo:', err);
    return null;
  }
};

export const disconnectEcho = () => {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
  }
};
