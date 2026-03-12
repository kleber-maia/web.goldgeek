import "@/styles/dashboard.css";
import "@/styles/admin/admin.css";

export const metadata = {
  title: "Admin - Gold Geek",
  description: "Gold Geek Admin Dashboard",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-body">
      {children}
    </div>
  );
}
