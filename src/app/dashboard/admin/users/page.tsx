"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  Ban,
  Mail,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  Download,
  Loader2,
} from "lucide-react";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  trading_capital: number;
  trading_style: string;
  is_suspended: boolean;
  referral_code: string;
  created_at: string;
  discipline_score: number;
  total_trades: number;
  active_plan: string;
  subscription_status: string;
}

const planColors: Record<string, string> = {
  monthly: "bg-blue-500/10 text-blue-500",
  yearly: "bg-purple-500/10 text-purple-500",
  none: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (userId: string, updates: Record<string, unknown>) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const createAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) return;
    setActionLoading("create-admin");
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          full_name: newAdminName,
        }),
      });
      if (res.ok) {
        setShowCreateAdmin(false);
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminName("");
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} total users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
            <div className="col-span-3">User</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-1">Plan</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-center">Discipline</div>
            <div className="col-span-1 text-right">Trades</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`grid grid-cols-12 gap-2 items-center px-5 py-3.5 text-sm hover:bg-muted/10 transition-colors ${
                    user.is_suspended ? "opacity-60" : ""
                  }`}
                >
                  <div className="col-span-3">
                    <p className="font-medium text-foreground text-xs truncate">
                      {user.full_name || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${planColors[user.active_plan] || planColors.none}`}>
                      {user.active_plan}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.is_suspended
                        ? "bg-destructive/10 text-destructive"
                        : statusColors[user.subscription_status] || statusColors.inactive
                    }`}>
                      {user.is_suspended ? "Suspended" : user.subscription_status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            user.discipline_score >= 80
                              ? "bg-success"
                              : user.discipline_score >= 60
                                ? "bg-amber-500"
                                : "bg-destructive"
                          }`}
                          style={{ width: `${user.discipline_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium w-8 text-right">
                        {user.discipline_score}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                    {user.total_trades}
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      title="View details"
                      onClick={() => setSelectedUser(user)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    {user.role !== "admin" && (
                      <>
                        <button
                          title={user.role === "admin" ? "Demote to user" : "Promote to admin"}
                          onClick={() => updateUser(user.id, { role: user.role === "admin" ? "user" : "admin" })}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-500" />
                        </button>
                        <button
                          title={user.is_suspended ? "Unsuspend" : "Suspend"}
                          onClick={() => updateUser(user.id, { is_suspended: !user.is_suspended })}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Ban className={`h-3.5 w-3.5 ${user.is_suspended ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border/50">
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user.full_name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${planColors[user.active_plan] || planColors.none}`}>
                    {user.active_plan}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Score: {user.discipline_score}/100</span>
                <span>{user.total_trades} trades</span>
                <button onClick={() => setSelectedUser(user)} className="text-success font-semibold">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-lg font-bold">User Details</h3>
                <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-muted cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                    <p className="text-sm font-medium">{selectedUser.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Role</p>
                    <p className="text-sm font-medium capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                    <p className="text-sm font-medium capitalize">{selectedUser.active_plan}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Capital</p>
                    <p className="text-sm font-medium">₹{selectedUser.trading_capital?.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Style</p>
                    <p className="text-sm font-medium capitalize">{selectedUser.trading_style}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Discipline Score</p>
                    <p className="text-sm font-bold">{selectedUser.discipline_score}/100</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Trades</p>
                    <p className="text-sm font-medium">{selectedUser.total_trades}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Referral Code</p>
                    <p className="text-sm font-mono">{selectedUser.referral_code || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Joined</p>
                    <p className="text-sm font-medium">{new Date(selectedUser.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                  {selectedUser.role !== "admin" && (
                    <>
                      <button
                        onClick={() => updateUser(selectedUser.id, { role: "admin" })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Make Admin
                      </button>
                      <button
                        onClick={() => updateUser(selectedUser.id, { is_suspended: !selectedUser.is_suspended })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          selectedUser.is_suspended
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        }`}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {selectedUser.is_suspended ? "Unsuspend" : "Suspend"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Admin Modal */}
      <AnimatePresence>
        {showCreateAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowCreateAdmin(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl"
            >
              <h3 className="font-heading text-lg font-bold mb-4">Create New Admin</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Admin name"
                    className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
                  />
                </div>
                <button
                  onClick={createAdmin}
                  disabled={actionLoading === "create-admin"}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === "create-admin" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Admin Account
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
