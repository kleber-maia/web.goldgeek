import "@/styles/dashboard.css";
import "@/styles/account/account.css";
import { getCurrentCustomer } from '@/lib/auth';
import { AccountIdentityProvider } from '@/components/account/AccountIdentity';

export const metadata = {
  title: "My Account - Gold Geek",
  description: "Manage your Gold Geek appraisals and payments",
};

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const customer = await getCurrentCustomer();
  const initial = (customer?.firstName || customer?.email || '').charAt(0).toUpperCase();
  return (
    <div className="account-body">
      <AccountIdentityProvider initial={initial}>{children}</AccountIdentityProvider>
    </div>
  );
}
