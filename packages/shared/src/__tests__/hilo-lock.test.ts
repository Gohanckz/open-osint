import { describe, it, expect } from 'vitest';
import { generateKeypair, sealContent, verifySeal, merkleRoot } from '../hilo-lock.js';
import { scanPii, piiSeverity } from '../pii.js';

describe('hilo-lock', () => {
  it('seals and verifies content', () => {
    const { privateKey } = generateKeypair();
    const data = { node: 'andres', tags: ['cartel'] };
    const proof = sealContent(data, privateKey);
    expect(verifySeal(data, proof)).toBe(true);
  });

  it('detects tampering', () => {
    const { privateKey } = generateKeypair();
    const proof = sealContent({ a: 1 }, privateKey);
    expect(verifySeal({ a: 2 }, proof)).toBe(false);
  });

  it('builds merkle root deterministically', () => {
    const a = merkleRoot(['aa', 'bb', 'cc', 'dd']);
    const b = merkleRoot(['aa', 'bb', 'cc', 'dd']);
    expect(a).toEqual(b);
    expect(a).toHaveLength(64);
  });
});

describe('pii', () => {
  it('detects email and phone', () => {
    const text = 'Contacto andres@example.com tel +57 300 555 1234';
    const hits = scanPii(text);
    const kinds = hits.map((h) => h.kind);
    expect(kinds).toContain('EMAIL');
    expect(kinds).toContain('PHONE');
    expect(piiSeverity(hits)).toBe('medium');
  });

  it('flags credit card as high severity', () => {
    const hits = scanPii('tarjeta 4111 1111 1111 1111');
    expect(piiSeverity(hits)).toBe('high');
  });
});
