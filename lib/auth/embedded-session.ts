import type { AppSession } from '@/lib/auth-session';

declare global {
  interface Window {
    __AGENTOPS_SESSION__?: AppSession | null;
  }
}

/** Session embedded by the chat layout — survives PPR shells and context gaps. */
export function getEmbeddedSession(): AppSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const session = window.__AGENTOPS_SESSION__;
  return session?.user ? session : null;
}
