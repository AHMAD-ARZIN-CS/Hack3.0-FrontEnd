/**
 * Session change signal shared by both auth implementations.
 * useSession() subscribes here, so any sign-in or sign-out re-renders the auth gate.
 */
const CHANGE_EVENT = "ebl:auth-change";

export const notifySessionChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export function subscribeSession(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  // "storage" keeps several open tabs in sync in demo mode.
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
