import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { PaymentDetailsService } from "@/lib/services/payment-details.service";
import { SettingsService } from "@/lib/services/settings.service";
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

  const preferences = PaymentDetailsService.preferences(customer.paymentPreferences);
  const defaultPaymentMethod = preferences.method;
  const savedAccountInfo = PaymentDetailsService.mask(preferences.accountInfo);

  const company = await SettingsService.getCompanyInfo();

  return (
    <SettingsClient
      supportEmail={company.supportEmail}
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
