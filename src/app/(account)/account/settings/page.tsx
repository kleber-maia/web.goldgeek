import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CustomerService } from "@/lib/services/customer.service";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@/lib/account";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session || session.type !== "customer") {
    redirect("/account/login");
  }

  const customer = await CustomerService.getById(session.id);

  if (!customer) {
    redirect("/account/login");
  }

  const defaultAddress =
    customer.addresses.find((address) => address.type === "shipping" && address.isDefault) ||
    customer.addresses.find((address) => address.type === "shipping") ||
    customer.addresses[0];

  const lastPayment = await prisma.payment.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: { method: true },
  });

  const allowedMethods = new Set<PaymentMethod>([
    "CHECK",
    "PAYPAL",
    "ZELLE",
    "ACH",
  ]);
  const lastMethod = lastPayment?.method as PaymentMethod | undefined;
  const defaultPaymentMethod =
    lastMethod && allowedMethods.has(lastMethod) ? lastMethod : "CHECK";

  return (
    <SettingsClient
      customer={{
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        address: defaultAddress
          ? {
              street1: defaultAddress.street1,
              street2: defaultAddress.street2,
              city: defaultAddress.city,
              state: defaultAddress.state,
              zipCode: defaultAddress.zipCode,
            }
          : undefined,
      }}
      defaultPaymentMethod={defaultPaymentMethod}
    />
  );
}
