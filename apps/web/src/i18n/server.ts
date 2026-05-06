import 'server-only';
import { cookies, headers } from 'next/headers';
import { es } from './messages/es';
import { en } from './messages/en';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locales';

const dictionaries = { es, en } as const;

/**
 * Detecta el locale del usuario:
 *   1. Cookie `oo_locale` (elección explícita del usuario)
 *   2. Header `Accept-Language` (negociación con el navegador)
 *   3. DEFAULT_LOCALE
 */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const fromCookie = c.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const h = await headers();
  const accept = h.get('accept-language') ?? '';
  // Toma la primera entrada (es-ES, en-US, ...)
  const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (isLocale(primary)) return primary;

  return DEFAULT_LOCALE;
}

/** Devuelve el diccionario completo para el locale activo. */
export async function getMessages() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
