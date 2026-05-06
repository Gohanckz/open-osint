import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, randomBytes, utf8ToBytes } from '@noble/hashes/utils';

export function sha256Hex(input: string | Uint8Array): string {
  const data = typeof input === 'string' ? utf8ToBytes(input) : input;
  return bytesToHex(sha256(data));
}

/**
 * Salt para hashear IPs (anti-doxxing / anti-enumeration). En producción es
 * MANDATORIO definir `IP_HASH_SALT` (un secreto rotable). Si falta, lanzamos al
 * arrancar — un fallback hardcoded haría todos los ipHash rainbow-tableables.
 */
function getIpHashSalt(): string {
  const v = process.env.IP_HASH_SALT;
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'IP_HASH_SALT env var is required in production. Generate with: openssl rand -base64 32',
      );
    }
    return 'hilo-dev-salt-rotate-monthly';
  }
  return v;
}

export function ipHash(ip: string, ua?: string): string {
  return sha256Hex(`${getIpHashSalt()}|${ip}|${ua ?? ''}`);
}

export function genToken(bytes = 32): string {
  return bytesToHex(randomBytes(bytes));
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function contentHash(value: unknown): string {
  return sha256Hex(canonicalize(value));
}
