import { requireAdmin } from "@/lib/auth";
import { getAllShippingLabels } from "@/lib/actions/admin/shipping.actions";
import ShippingClient from "./ShippingClient";

export default async function ShippingLabelsPage() {
  await requireAdmin();

  const result = await getAllShippingLabels();

  return <ShippingClient labels={result.success ? result.data : []} />;
}
