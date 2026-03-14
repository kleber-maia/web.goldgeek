import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { AccountContainer } from "@/components/account";
import { getMyReturns } from "@/lib/actions/customer.actions";
import ReturnsClient from "./ReturnsClient";

export default async function CustomerReturnsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getMyReturns();

  if (!result.success) {
    return (
      <AccountContainer
        headerProps={{
          title: "My Returns",
          showBackButton: true,
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "red" }}>Error loading returns</p>
        </div>
      </AccountContainer>
    );
  }

  return <ReturnsClient returns={result.data || []} />;
}
