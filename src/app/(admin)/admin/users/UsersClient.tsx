"use client";

import { useState, useTransition } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { createAdminUser, deleteAdminUser } from "@/lib/actions/admin/user.actions";

interface User {
  id: string;
  email: string;
  createdAt: Date | string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function UsersClient({
  users: initialUsers,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setError("");
    startTransition(async () => {
      const result = await createAdminUser(newEmail);
      if (result.success && result.data) {
        setUsers([result.data as User, ...users]);
        setNewEmail("");
        setShowCreateModal(false);
      } else {
        setError(result.error || "Failed to create admin user");
      }
    });
  };

  const handleDelete = (user: User) => {
    setError("");
    startTransition(async () => {
      const result = await deleteAdminUser(user.id);
      if (result.success) {
        setUsers(users.filter((u) => u.id !== user.id));
        setShowDeleteModal(null);
      } else {
        setError(result.error || "Failed to delete admin user");
      }
    });
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Admin Users" backHref="/admin" />

        {/* Search and Create */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div className="admin-search-wrapper" style={{ flex: 1, minWidth: "200px" }}>
            <svg className="admin-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              className="admin-search"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-btn admin-btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Admin
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "8px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredUsers.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No admin users found</div>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-name">{user.email}</div>
                    <div className="admin-card-meta" style={{ marginTop: "4px" }}>
                      {user.id === currentUserId ? "(You)" : ""}
                    </div>
                  </div>
                </div>
                <div className="admin-card-footer">
                  <span className="admin-card-meta">
                    Since {formatDate(user.createdAt)}
                  </span>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => setShowDeleteModal(user)}
                      className="admin-btn admin-btn-danger"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                    No admin users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.email}
                      {user.id === currentUserId && (
                        <span style={{ marginLeft: "8px", color: "#6B7280", fontSize: "12px" }}>
                          (You)
                        </span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => setShowDeleteModal(user)}
                          className="admin-table-link"
                          style={{ color: "#DC2626" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Add Admin User</h3>
            <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "16px" }}>
              Enter the email address for the new admin user.
            </p>
            <input
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="admin-input"
              style={{ marginBottom: "16px" }}
            />
            {error && (
              <div style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewEmail("");
                  setError("");
                }}
                className="admin-btn"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="admin-btn admin-btn-primary"
                disabled={isPending || !newEmail.includes("@")}
              >
                {isPending ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Delete Admin User</h3>
            <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "16px" }}>
              Are you sure you want to delete <strong>{showDeleteModal.email}</strong>?
              This action cannot be undone.
            </p>
            {error && (
              <div style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowDeleteModal(null);
                  setError("");
                }}
                className="admin-btn"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="admin-btn admin-btn-danger"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }
        .admin-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
        }
        .admin-modal-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .admin-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
        }
        .admin-input:focus {
          outline: none;
          border-color: #AD7B2A;
        }
        .admin-btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #E5E7EB;
          background: white;
          cursor: pointer;
        }
        .admin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .admin-btn-primary {
          background: #AD7B2A;
          color: white;
          border-color: #AD7B2A;
        }
        .admin-btn-danger {
          background: #DC2626;
          color: white;
          border-color: #DC2626;
        }
      `}</style>
    </div>
  );
}
