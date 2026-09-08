'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { applyCurrentShippingAddress } from '@/lib/actions/customer.actions';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
export default function KitDestination({ kitId, address, onUpdated }: { kitId: string; address: string; onUpdated?: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return <section className="rounded-lg border border-stone-200 p-4 my-5">
    <h2 className="font-semibold">Return and check mailing address</h2>
    <p className="my-2">{address}</p>
    <p className="text-sm">This kit keeps its own address. Updating Settings does not change it automatically.</p>
    <Link href="/account/settings" className="underline text-sm">Edit your shipping address in Settings</Link>
    <button type="button" disabled={pending} onClick={() => setConfirm(true)} className="block underline mt-3 text-sm">Use my current shipping address for this kit</button>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    <ConfirmDialog isOpen={confirm} title="Update this kit’s destination?" message="Use your current default shipping address from Settings for this kit’s return shipment or check. This is allowed only before the return label or payout is prepared." confirmLabel="Update destination" onCancel={() => setConfirm(false)} onConfirm={async () => {
      setConfirm(false); setPending(true);
      try { const result = await applyCurrentShippingAddress(kitId); setMessage(result.success ? 'Destination updated.' : result.error || 'Unable to update destination.'); if (result.success) { router.refresh(); onUpdated?.(); } }
      finally { setPending(false); }
    }} />
  </section>;
}
