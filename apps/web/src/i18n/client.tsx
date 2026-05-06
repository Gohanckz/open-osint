'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { es } from './messages/es';
import { en } from './messages/en';
import { LOCALE_COOKIE, type Locale } from './locales';
import type { Messages } from './messages/es';

interface I18nContext {
  locale: Locale;
  t: Messages;
  setLocale: (next: Locale) => void;
}

const Ctx = createContext<I18nContext | null>(null);
const dictionaries = { es, en } as const;

/**
 * Provider que se monta en el layout root con el locale resuelto en server.
 * El cambio de idioma escribe la cookie y recarga la página (server re-render
 * con los nuevos diccionarios — más simple y robusto que sync via context).
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nContext>(
    () => ({
      locale: initialLocale,
      t: dictionaries[initialLocale],
      setLocale: (next) => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        window.location.reload();
      },
    }),
    [initialLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Hook principal para client components. */
export function useI18n(): I18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback seguro si por alguna razón un componente está fuera del provider
    return {
      locale: 'es',
      t: es,
      setLocale: () => {},
    };
  }
  return ctx;
}

/** Atajo: solo el diccionario. */
export function useT() {
  return useI18n().t;
}
