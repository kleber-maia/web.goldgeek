import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { serializePrismaData } from "@/lib/db/utils";
import DashboardClient from "@/components/account/DashboardClient";
import type { DashboardData } from "@/components/account/DashboardClient";

const ACTIVE_KIT_STATUSES = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING"] as const;

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

  // Fetch kits and payments
  const [kits, payments] = await Promise.all([
    CustomerService.getKits(session.id),
    CustomerService.getPayments(session.id),
  ]);

  // Compute stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeKits = kits.filter((k: any) =>
    (ACTIVE_KIT_STATUSES as readonly string[]).includes(k.status)
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kitsWithOffer = kits.filter((k: any) => k.status === "OFFER_SENT");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kitsNeedingLabel = kits.filter(
    (k: any) =>
      k.type === "DIGITAL" &&
      ["PENDING", "KIT_SENT"].includes(k.status) &&
      (k.shippingLabels?.length ?? 0) === 0
  );

  const totalEarned = payments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => ["COMPLETED", "SENT"].includes(p.status))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0);

  // Build action required items
  const actionRequired = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...kitsWithOffer.map((kit: any) => ({
      type: "offer" as const,
      kitId: kit.id,
      kitNumber: kit.kitNumber,
      offerValue: kit.offers?.[0]
        ? parseFloat(kit.offers[0].totalValue.toString())
        : undefined,
      itemCount: kit.items?.length ?? 0,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...kitsNeedingLabel.map((kit: any) => ({
      type: "label" as const,
      kitId: kit.id,
      kitNumber: kit.kitNumber,
    })),
  ];

  // Recent kits (up to 5, most recent first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentKits = kits.slice(0, 5).map((kit: any) => ({
    id: kit.id,
    kitNumber: kit.kitNumber,
    status: kit.status,
    type: kit.type,
    createdAt: kit.createdAt.toISOString ? kit.createdAt.toISOString() : String(kit.createdAt),
    itemCount: kit.items?.length ?? 0,
    offerValue: kit.offers?.[0]
      ? parseFloat(kit.offers[0].totalValue.toString())
      : undefined,
  }));

  // Recent payments (up to 5)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPayments = payments.slice(0, 5).map((p: any) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    amount: parseFloat(p.amount.toString()),
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
