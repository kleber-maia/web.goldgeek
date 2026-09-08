import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { appendCarrierLabel, validateCarrierPdf } from '../src/lib/account/digital-kit-pdf';

test('packet preserves every original carrier page and its dimensions', async () => {
  const instructions = await PDFDocument.create();
  instructions.addPage([612, 792]);
  const carrier = await PDFDocument.create();
  carrier.addPage([288, 432]).drawText('ORIGINAL CARRIER LABEL');
  carrier.addPage([612, 792]).drawText('CUSTOMS COPY');
  const base64 = Buffer.from(await carrier.save()).toString('base64');
  const packet = await PDFDocument.load(await appendCarrierLabel(await instructions.save(), base64));
  assert.equal(packet.getPageCount(), 3);
  assert.deepEqual(packet.getPages().map(page => page.getSize()), [
    { width: 612, height: 792 }, { width: 288, height: 432 }, { width: 612, height: 792 },
  ]);
  // Copied carrier pages retain their content streams, rather than blank substitutes.
  assert.ok(packet.getPage(1).node.Contents());
  assert.ok(packet.getPage(2).node.Contents());
});

test('missing, malformed, and empty carrier files cannot produce a packet', async () => {
  for (const value of ['', 'not a PDF', Buffer.from('%PDF-broken').toString('base64')]) {
    await assert.rejects(validateCarrierPdf(value));
  }
  const empty = await PDFDocument.create();
  await assert.rejects(validateCarrierPdf(Buffer.from(await empty.save({ addDefaultPage: false })).toString('base64')));
});
