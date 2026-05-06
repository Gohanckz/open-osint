// Hilo Lock - sello criptográfico verificable con ed25519.
// Permite probar que cierto contenido existía en cierto timestamp.

import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { canonicalize } from './crypto.js';

export interface HiloLockProof {
  payloadHash: string; // hex
  signature: string; // hex
  publicKey: string; // hex
  algo: 'ed25519';
  createdAt: string; // ISO
}

export function generateKeypair(): { privateKey: string; publicKey: string } {
  const priv = ed25519.utils.randomPrivateKey();
  const pub = ed25519.getPublicKey(priv);
  return { privateKey: bytesToHex(priv), publicKey: bytesToHex(pub) };
}

export function sealContent(
  content: unknown,
  privateKeyHex: string,
): HiloLockProof {
  const canonical = canonicalize(content);
  const hash = sha256(utf8ToBytes(canonical));
  const priv = hexToBytes(privateKeyHex);
  const pub = ed25519.getPublicKey(priv);
  const sig = ed25519.sign(hash, priv);
  return {
    payloadHash: bytesToHex(hash),
    signature: bytesToHex(sig),
    publicKey: bytesToHex(pub),
    algo: 'ed25519',
    createdAt: new Date().toISOString(),
  };
}

export function verifySeal(content: unknown, proof: HiloLockProof): boolean {
  const canonical = canonicalize(content);
  const hash = sha256(utf8ToBytes(canonical));
  if (bytesToHex(hash) !== proof.payloadHash) return false;
  return ed25519.verify(
    hexToBytes(proof.signature),
    hash,
    hexToBytes(proof.publicKey),
  );
}

export function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return '';
  let layer = hashes.map((h) => hexToBytes(h));
  while (layer.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i]!;
      const b = layer[i + 1] ?? a;
      const concat = new Uint8Array(a.length + b.length);
      concat.set(a, 0);
      concat.set(b, a.length);
      next.push(sha256(concat));
    }
    layer = next;
  }
  return bytesToHex(layer[0]!);
}
