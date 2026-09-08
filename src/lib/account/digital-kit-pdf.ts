import { PDFDocument } from 'pdf-lib';

async function loadCarrierPdf(labelBase64: string) {
  if (!labelBase64.startsWith('JVBERi0')) throw new Error('Your carrier label is not ready. Retry or contact support.');
  try {
    const label = await PDFDocument.load(labelBase64);
    if (!label.getPageCount()) throw new Error('Empty carrier PDF');
    return label;
  } catch {
    throw new Error('Your carrier label could not be read. Retry or contact support.');
  }
}

export async function validateCarrierPdf(labelBase64: string): Promise<void> {
  await loadCarrierPdf(labelBase64);
}

export async function appendCarrierLabel(instructions: ArrayBuffer | Uint8Array, labelBase64: string): Promise<Uint8Array> {
  const label = await loadCarrierPdf(labelBase64);
  const document = await PDFDocument.load(instructions);
  for (const page of await document.copyPages(label, label.getPageIndices())) document.addPage(page);
  return document.save();
}
