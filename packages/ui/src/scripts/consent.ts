// Consent hook. Google Consent Mode v2 defaults (all denied) are set by the ads
// loader before any ad script runs. A Google-certified TCF CMP (required before
// serving personalised ads in the EEA, UK and Switzerland) talks to Google tags
// directly; for anything else, call window.microConsent.update().

export type ConsentValue = 'granted' | 'denied';
export interface ConsentState {
  ad_storage?: ConsentValue;
  ad_user_data?: ConsentValue;
  ad_personalization?: ConsentValue;
  analytics_storage?: ConsentValue;
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
    __tcfapi?: (...args: unknown[]) => void;
    microConsent?: { update: (state: ConsentState) => void };
  }
}

export const DEFAULT_DENIED: Required<ConsentState> = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
};

export function ensureGtag(): Gtag {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // gtag expects the `arguments` object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

export function setConsentDefaults() {
  const gtag = ensureGtag();
  gtag('consent', 'default', { ...DEFAULT_DENIED, wait_for_update: 500 });
  window.microConsent = {
    update(state) {
      gtag('consent', 'update', state);
    },
  };
}

export function openCookieSettings() {
  // Google Privacy & messaging (Funding Choices) CMP, if installed.
  if (window.googlefc?.callbackQueue && window.googlefc.showRevocationMessage) {
    window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
    return;
  }
  const dialog = document.getElementById('cookie-settings') as HTMLDialogElement | null;
  dialog?.showModal();
}
