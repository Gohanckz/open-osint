import { prisma } from '@hilo/db';
import { makeWorker, QUEUES } from '../queue.js';

export interface OcrJob {
  attachmentId: string;
}

export const ocrWorker = makeWorker<OcrJob>(QUEUES.ocr, async ({ data }) => {
  const att = await prisma.attachment.findUnique({ where: { id: data.attachmentId } });
  if (!att) return { skipped: true };

  // MVP placeholder: aquí se integraría tesseract.js / Mistral OCR / textract.
  const fakeText = `[OCR pending integration] ${att.filename}`;
  await prisma.attachment.update({
    where: { id: att.id },
    data: { ocrText: fakeText, ocrStatus: 'done' },
  });
  return { ok: true };
});
