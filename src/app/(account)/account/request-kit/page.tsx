import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import RequestKitClient from "./RequestKitClient";
import { serializePrismaData } from "@/lib/db/utils";

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
