'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker enregistré:', registration.scope);
          })
          .catch((error) => {
            console.log('⚠️ Service Worker échec:', error);
          });
      });
    }
  }, []);

  return null;
}
