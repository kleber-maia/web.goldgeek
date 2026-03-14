import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@/lib/account";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
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

  const defaultAddress =
    customer.addresses.find((address) => address.type === "shipping" && address.isDefault) ||
    customer.addresses.find((address) => address.type === "shipping") ||
    customer.addresses[0];

  // Read saved preferences from customer record first, fall back to last payment
  const allowedMethods = new Set<PaymentMethod>(["CHECK", "PAYPAL", "ZELLE", "ACH"]);
  const savedPrefs = customer.paymentPreferences as {
    method?: string;
    accountInfo?: Record<string, string>;
  } | null;

  let defaultPaymentMethod: PaymentMethod = "CHECK";
  let savedAccountInfo: Record<string, string> = {};

  if (savedPrefs?.method && allowedMethods.has(savedPrefs.method as PaymentMethod)) {
    defaultPaymentMethod = savedPrefs.method as PaymentMethod;
    savedAccountInfo = savedPrefs.accountInfo || {};
  } else {
    // Fall back to last payment method if no saved preferences
    const lastPayment = await prisma.payment.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { method: true },
    });
    const lastMethod = lastPayment?.method as PaymentMethod | undefined;
    if (lastMethod && allowedMethods.has(lastMethod)) {
      defaultPaymentMethod = lastMethod;
    }
  }

  return (
    <SettingsClient
      customer={{
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || "",
        address: defaultAddress
          ? {
              id: defaultAddress.id,
              street1: defaultAddress.street1,
              street2: defaultAddress.street2,
              city: defaultAddress.city,
              state: defaultAddress.state,
              zipCode: defaultAddress.zipCode,
            }
          : undefined,
      }}
      defaultPaymentMethod={defaultPaymentMethod}
      savedAccountInfo={savedAccountInfo}
    />
  );
}
