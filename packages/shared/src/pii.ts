// PII detection - heurística antes de LLM (rápida y barata).
// Se usa al cambiar visibility a PUBLIC para advertir al usuario.

export type PiiKind =
  | 'EMAIL'
  | 'PHONE'
  | 'DOC_ID'
  | 'CREDIT_CARD'
  | 'IBAN'
  | 'IP'
  | 'DOB'
  | 'ADDRESS_HINT'
  | 'CHILD_NAME_HINT';

export interface PiiHit {
  kind: PiiKind;
  value: string;
  start: number;
  end: number;
  confidence: 'low' | 'medium' | 'high';
}

const RE = {
  EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  PHONE: /(?<!\d)(?:\+?\d[\d\s\-().]{7,}\d)(?!\d)/g,
  DOC_ID: /\b\d{6,12}-?[\dA-Z]?\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,
  IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g,
  IP: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  DOB: /\b(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[012])[\/\-.](?:19|20)\d{2}\b/g,
};

export function scanPii(text: string): PiiHit[] {
  if (!text) return [];
  const hits: PiiHit[] = [];

  for (const [kind, regex] of Object.entries(RE) as [PiiKind, RegExp][]) {
    for (const m of text.matchAll(regex)) {
      if (m.index === undefined) continue;
      hits.push({
        kind,
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
        confidence: kind === 'EMAIL' || kind === 'IBAN' ? 'high' : 'medium',
      });
    }
  }

  if (/\b(menor|niñ[oa]|child|kid|hijo|hija)\b/i.test(text)) {
    hits.push({ kind: 'CHILD_NAME_HINT', value: '', start: 0, end: 0, confidence: 'low' });
  }

  return hits;
}

export function redact(text: string, hits: PiiHit[] = scanPii(text)): string {
  if (!hits.length) return text;
  const sorted = [...hits].sort((a, b) => b.start - a.start);
  let out = text;
  for (const h of sorted) {
    if (h.end <= h.start) continue;
    out = out.slice(0, h.start) + `[REDACTED:${h.kind}]` + out.slice(h.end);
  }
  return out;
}

export function piiSeverity(hits: PiiHit[]): 'none' | 'low' | 'medium' | 'high' {
  if (!hits.length) return 'none';
  if (hits.some((h) => h.kind === 'CREDIT_CARD' || h.kind === 'CHILD_NAME_HINT' || h.kind === 'DOC_ID'))
    return 'high';
  if (hits.some((h) => h.kind === 'PHONE' || h.kind === 'EMAIL' || h.kind === 'DOB' || h.kind === 'IBAN'))
    return 'medium';
  return 'low';
}
