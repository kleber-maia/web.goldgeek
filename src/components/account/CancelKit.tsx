'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared';
import { cancelCustomerKit } from '@/lib/actions/customer.actions';

export default function CancelKit({ kitId, kitNumber }: { kitId: string; kitNumber: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setConfirming(false);
    setPending(true);
    setError(null);
    try {
      const result = await cancelCustomerKit(kitId);
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to cancel this kit. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-4 border-t border-gray-200 pt-3">
    <p className="text-sm mb-1">Changed your mind? You can cancel before sending your items.</p>
    <button type="button" className="min-h-11 underline text-sm font-medium disabled:opacity-50" disabled={pending} onClick={() => setConfirming(true)}>{pending ? 'Cancelling…' : 'Cancel kit'}</button>
    {error && <p role="alert" className="account-alert account-alert-error mt-3">{error}</p>}
    <ConfirmDialog isOpen={confirming} title={`Cancel kit ${kitNumber}?`} message="This closes your appraisal request and cancels its unused shipping labels. Do not send items using this kit after cancelling. You can request another kit when no other kit is awaiting shipment." confirmLabel="Cancel kit" cancelLabel="Keep kit" variant="danger" onCancel={() => setConfirming(false)} onConfirm={() => void cancel()} />
  </div>;
}
