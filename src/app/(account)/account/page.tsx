import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { serializePrismaData } from "@/lib/db/utils";
import DashboardClient from "@/components/account/DashboardClient";
import type { DashboardData } from "@/components/account/DashboardClient";

type CustomerKit = Awaited<ReturnType<typeof CustomerService.getKits>>[number];
type CustomerPayment = Awaited<ReturnType<typeof CustomerService.getPayments>>[number];

const ACTIVE_KIT_STATUSES = ["PENDING", "SHIPPED", "EVALUATING"] as const;

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

  const [kits, payments] = await Promise.all([
    CustomerService.getKits(session.id),
    CustomerService.getPayments(session.id),
  ]);

  const activeKits = kits.filter((k: CustomerKit) =>
    (ACTIVE_KIT_STATUSES as readonly string[]).includes(k.status)
  );
  const kitsWithOffer = kits.filter((k: CustomerKit) => k.status === "OFFER_SENT");
  const kitsNeedingLabel = kits.filter(
    (k: CustomerKit) =>
      k.type === "DIGITAL" &&
      ["PENDING", "SHIPPED"].includes(k.status) &&
      (k.shippingLabels?.length ?? 0) === 0
  );

  const totalEarned = payments
    .filter((p: CustomerPayment) => ["COMPLETED", "SENT"].includes(p.status))
    .reduce((sum: number, p: CustomerPayment) => sum + toNumber(p.amount), 0);

  const actionRequired = [
    ...kitsWithOffer.map((kit: CustomerKit) => ({
      type: "offer" as const,
      kitId: kit.id,
      kitNumber: kit.kitNumber,
      offerValue: kit.offers?.[0]
        ? toNumber(kit.offers[0].totalValue)
        : undefined,
      itemCount: kit.items?.length ?? 0,
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
    type: kit.type,
    createdAt: kit.createdAt.toISOString ? kit.createdAt.toISOString() : String(kit.createdAt),
    itemCount: kit.items?.length ?? 0,
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
    customerInitial,
    stats: {
      totalKits: kits.length,
      activeKits: activeKits.length,
      offersReady: kitsWithOffer.length,
      totalEarned,
    },
    actionRequired,
    recentKits,
    recentPayments,
  };

  return <DashboardClient data={serializePrismaData(data)} />;
}
