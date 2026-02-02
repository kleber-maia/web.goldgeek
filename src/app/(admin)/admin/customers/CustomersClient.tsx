"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date | string;
  user: {
    email: string;
  };
  addresses: any[];
  kits: any[];
  payments: any[];
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      customer.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate total value for each customer
  const customersWithStats = filteredCustomers.map((customer) => {
    const totalValue = customer.payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount?.toString() || "0");
    }, 0);

    return {
      ...customer,
      totalValue,
      requestCount: customer.kits.length,
    };
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Customers" backHref="/admin" />

        {/* Search */}
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="admin-search"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {customersWithStats.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No customers found</div>
              </div>
            </div>
          ) : (
            customersWithStats.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="admin-card"
              >
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-name">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="admin-card-meta" style={{ marginTop: "4px" }}>
                      {customer.user.email}
                    </div>
                  </div>
                </div>
                <div className="admin-card-meta">
                  {customer.requestCount} kits &bull; Since {formatDate(customer.createdAt)}
                </div>
                <div className="admin-card-footer">
                  <span style={{ fontSize: "14px", color: "#AD7B2A", fontWeight: 500 }}>
                    {customer.totalValue > 0 ? formatCurrency(customer.totalValue) : "No payments"}
                  </span>
                  <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Kits</th>
                <th>Total Value</th>
                <th>Since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customersWithStats.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                customersWithStats.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.firstName} {customer.lastName}</td>
                    <td>{customer.user.email}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.requestCount}</td>
                    <td>
                      {customer.totalValue > 0 ? formatCurrency(customer.totalValue) : "-"}
                    </td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      <Link href={`/admin/customers/${customer.id}`} className="admin-table-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
