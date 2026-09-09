import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { KitService } from "@/lib/services/kit.service";
import RequestKitClient from "./RequestKitClient";
import { serializePrismaData } from "@/lib/db/utils";
import Link from 'next/link';
import { AccountContainer } from '@/components/account';

export default async function RequestKitPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const customer = await CustomerService.getById(session.id);

  if (!customer) {
    redirect("/account/login");
  }

  const awaiting = await KitService.getAwaitingShipment(session.id);
  if (awaiting) {
    return <AccountContainer headerProps={{ title: 'Your existing kit', showBackButton: true, backHref: '/account' }}>
      <section className="account-section">
        <h2 className="text-lg font-semibold mb-2">You already have a kit to send</h2>
        <p className="text-sm mb-4">Kit {awaiting.kitNumber} is waiting for preparation or shipment. Continue with that kit, or cancel it before requesting another.</p>
        <Link className="account-btn account-btn-primary" href={`/account/kit/${awaiting.id}`}>View your kit</Link>
      </section>
    </AccountContainer>;
  }

  if (!customer.firstName.trim() || !customer.lastName.trim()) {
    return <AccountContainer headerProps={{ title: 'Request New Kit', showBackButton: true }}>
      <p className="mb-4">Add your first and last name so we can prepare your shipping label and payment correctly.</p>
      <Link className="account-btn account-btn-primary" href="/account/settings">Complete your profile</Link>
    </AccountContainer>;
  }

  const defaultAddress =
    customer.addresses.find((a) => a.type === "shipping" && a.isDefault) ||
    customer.addresses.find((a) => a.type === "shipping") ||
    customer.addresses[0];

  return (
    <RequestKitClient
      customer={serializePrismaData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      })}
      defaultAddress={defaultAddress ? serializePrismaData(defaultAddress) : null}
    />
  );
}
