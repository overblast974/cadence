import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // Safari iOS expose ce flag plutôt que `display-mode`.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

interface InstallPromptState {
  /** Le navigateur a proposé l'installation : on peut déclencher la boîte de dialogue native. */
  canPrompt: boolean;
  /** L'app tourne déjà en mode installé (PWA autonome). */
  installed: boolean;
  /** Déclenche la boîte de dialogue d'installation native. Renvoie `true` si l'utilisateur a accepté. */
  promptInstall: () => Promise<boolean>;
}

/**
 * Capture l'évènement `beforeinstallprompt` (Chrome/Edge/Samsung Internet) pour pouvoir
 * proposer un bouton d'installation natif directement depuis l'interface, plutôt que de
 * compter sur le menu du navigateur. Sur Safari/iOS, qui ne déclenche jamais cet évènement,
 * `canPrompt` reste `false` et l'appelant doit afficher les instructions manuelles.
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setInstalled(true);
      setDeferredEvent(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredEvent) return false;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    setDeferredEvent(null);
    return outcome === 'accepted';
  }

  return { canPrompt: deferredEvent !== null, installed, promptInstall };
}
