/**
 * Idiomas soportados por la app. Para añadir uno nuevo:
 *  1. Añade el código aquí (ej. 'pt')
 *  2. Crea `messages/<código>.ts` exportando un objeto del mismo shape que `es.ts`
 *  3. Importa y registra en `loadMessages()` (i18n/messages.ts)
 */
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string }> = {
  es: { native: 'Español', flag: '🇪🇸' },
  en: { native: 'English', flag: '🇬🇧' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Cookie usada para persistir la elección del usuario. */
export const LOCALE_COOKIE = 'oo_locale';
