import "@/styles/account/account.css";

export const metadata = {
  title: "My Account - Gold Geek",
  description: "Manage your Gold Geek appraisals and payments",
};

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="account-body">
      {children}
    </div>
  );
}
