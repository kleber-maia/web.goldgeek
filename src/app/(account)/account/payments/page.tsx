import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { AccountContainer } from "@/components/account";
import { getMyPayments } from "@/lib/actions/customer.actions";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getMyPayments();

  if (!result.success) {
    return (
      <AccountContainer
        headerProps={{
          title: "My Payments",
          showBackButton: true,
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "red" }}>Error loading payments</p>
        </div>
      </AccountContainer>
    );
  }

  const payments = result.data || [];

  return <PaymentsClient payments={payments} />;
}
