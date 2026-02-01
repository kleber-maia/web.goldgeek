"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data for customers
const customers = [
  {
    id: "c1",
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "(555) 123-4567",
    location: "New York, NY",
    requests: 2,
    totalValue: "$3,607.60",
    since: "Dec 15, 2024",
  },
  {
    id: "c2",
    name: "Jane Smith",
    email: "jane.smith@email.com",
    phone: "(555) 234-5678",
    location: "Los Angeles, CA",
    requests: 2,
    totalValue: "$1,852.15",
    since: "Dec 20, 2024",
  },
  {
    id: "c3",
    name: "Bob Wilson",
    email: "bob.wilson@email.com",
    phone: "(555) 345-6789",
    location: "Chicago, IL",
    requests: 2,
    totalValue: "$85.00",
    since: "Jan 2, 2025",
  },
  {
    id: "c4",
    name: "Mary Johnson",
    email: "mary.j@email.com",
    phone: "(555) 456-7890",
    location: "Houston, TX",
    requests: 2,
    totalValue: "$245.50",
    since: "Jan 5, 2025",
  },
  {
    id: "c5",
    name: "David Brown",
    email: "david.brown@email.com",
    phone: "(555) 567-8901",
    location: "Phoenix, AZ",
    requests: 2,
    totalValue: "$384.98",
    since: "Jan 8, 2025",
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Customers" backHref="/admin" />

        {/* Search Bar */}
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

        {/* Customer Cards (Mobile) */}
        <div className="admin-card-list">
          {filteredCustomers.map((customer) => (
            <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-name">{customer.name}</div>
                  <div className="admin-card-meta">{customer.email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#AD7B2A" }}>{customer.requests} requests</div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>{customer.totalValue} total</div>
                </div>
              </div>
              <div className="admin-card-footer">
                <span className="admin-card-meta">{customer.phone}</span>
                <span style={{ fontSize: "12px", color: "#6B7280" }}>Since {customer.since}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Requests</th>
                <th>Total Value</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} onClick={() => window.location.href = `/admin/customers/${customer.id}`} style={{ cursor: "pointer" }}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.location}</td>
                  <td>{customer.requests}</td>
                  <td>{customer.totalValue}</td>
                  <td>{customer.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
