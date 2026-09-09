import { isActionableOffer, canPrepareDigitalKit, hasAccessedDigitalKit } from '@/lib/account/kit-policy';
import { formatCustomerKitStatus } from '@/lib/account/utils';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { KitService } from "@/lib/services/kit.service";
import { serializePrismaData } from "@/lib/db/utils";
import DashboardClient from "@/components/account/DashboardClient";
import type { DashboardData } from "@/components/account/DashboardClient";

type CustomerKit = Awaited<ReturnType<typeof CustomerService.getKits>>[number];
type CustomerPayment = Awaited<ReturnType<typeof CustomerService.getPayments>>[number];



function toNumber(value: { toString(): string }): number {
  return parseFloat(value.toString());
}

export default async function AccountDashboardPage() {
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

  const firstName = customer.firstName || customer.email.split("@")[0];
  const customerInitial = firstName.charAt(0).toUpperCase();

  const [{ kits, payments, actionKits, stats }, awaitingShipmentKit] = await Promise.all([
    CustomerService.getDashboard(session.id), KitService.getAwaitingShipment(session.id),
  ]);
  const kitsWithOffer = actionKits.filter(k => k.status === 'OFFER_SENT' && k.offers.some(offer => isActionableOffer(offer)));
  const kitsNeedingLabel = actionKits.filter(kit => canPrepareDigitalKit(kit) && !hasAccessedDigitalKit(kit));

  const actionRequired = [
    ...kitsWithOffer.map((kit: CustomerKit) => ({
      type: "offer" as const,
      kitId: kit.id,
      kitNumber: kit.kitNumber,
      offerValue: kit.offers.find(offer => isActionableOffer(offer))
        ? toNumber(kit.offers.find(offer => isActionableOffer(offer))!.totalValue)
        : undefined,
      itemCount: kit.items?.reduce((total, item) => total + (item.quantity || 1), 0) ?? 0,
    })),
    ...kitsNeedingLabel.map((kit: CustomerKit) => ({
      type: "label" as const,
      kitId: kit.id,
      kitNumber: kit.kitNumber,
    })),
  ];

  const recentKits = kits.slice(0, 5).map((kit: CustomerKit) => ({
    id: kit.id,
    kitNumber: kit.kitNumber,
    status: kit.status,
    statusLabel: formatCustomerKitStatus(kit),
    type: kit.type,
    createdAt: kit.createdAt.toISOString ? kit.createdAt.toISOString() : String(kit.createdAt),
    itemCount: kit.items?.reduce((total, item) => total + (item.quantity || 1), 0) ?? 0,
    offerValue: kit.offers?.[0]
      ? toNumber(kit.offers[0].totalValue)
      : undefined,
  }));

  const recentPayments = payments.slice(0, 5).map((p: CustomerPayment) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    amount: toNumber(p.amount),
    method: p.method,
    status: p.status,
    createdAt: p.createdAt.toISOString ? p.createdAt.toISOString() : String(p.createdAt),
    kitNumber: p.offer?.kit?.kitNumber ?? "",
  }));

  const data: DashboardData = {
    firstName,
    awaitingShipmentKit,
    customerInitial,
    stats,
    actionRequired,
    recentKits,
    recentPayments,
  };

  return <DashboardClient data={serializePrismaData(data)} />;
}
