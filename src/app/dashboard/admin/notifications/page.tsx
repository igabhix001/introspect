"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Send,
  Users,
  User,
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  Megaphone,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  target_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  alert: AlertCircle,
};

const typeColors: Record<string, string> = {
  info: "text-blue-500 bg-blue-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  success: "text-success bg-success/10",
  alert: "text-destructive bg-destructive/10",
};

const templates = [
  { title: "Maintenance Notice", message: "We'll be performing scheduled maintenance. The platform may be temporarily unavailable.", type: "warning" },
  { title: "New Feature Launch", message: "We've launched a new feature! Check your dashboard for the latest updates.", type: "success" },
  { title: "Payment Reminder", message: "Your subscription is expiring soon. Renew now to continue uninterrupted access.", type: "info" },
  { title: "Security Alert", message: "We've detected unusual activity on your account. Please review your recent sessions.", type: "alert" },
];

import { useAdminNotificationsQuery } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all", targetUserId: "" });
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useAdminNotificationsQuery();

  const notifications: NotificationItem[] = data?.notifications || [];
  const loading = isLoading && !data;

  async function sendNotification() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ title: "", message: "", type: "info", target: "all", targetUserId: "" });
        queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
        setTimeout(() => {
          setSuccess(false);
          setShowForm(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Notification Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send and manage platform notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-semibold transition-colors cursor-pointer"
        >
          <Megaphone className="h-3.5 w-3.5" />
          New Notification
        </button>
      </div>

      {/* Compose Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-heading text-sm font-bold">Compose Notification</h3>

              {/* Templates */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.title}
                      onClick={() => setForm({ ...form, title: t.title, message: t.message, type: t.type })}
                      className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Notification title"
                    className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 cursor-pointer"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Target</label>
                    <select
                      value={form.target}
                      onChange={(e) => setForm({ ...form, target: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 cursor-pointer"
                    >
                      <option value="all">All Users</option>
                      <option value="individual">Specific User</option>
                    </select>
                  </div>
                </div>
              </div>

              {form.target === "individual" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
                  <input
                    type="text"
                    value={form.targetUserId}
                    onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}
                    placeholder="Enter user UUID"
                    className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Notification message..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40 resize-none"
                />
              </div>

              <button
                onClick={sendNotification}
                disabled={sending || !form.title || !form.message}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="font-heading text-sm font-bold">Notification History</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            No notifications sent yet
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Info;
              const color = typeColors[notif.type] || typeColors.info;
              return (
                <div key={notif.id} className="flex items-start gap-3 px-5 py-4 hover:bg-muted/10 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {notif.target === "all" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        {notif.target === "all" ? "All Users" : "Individual"}
                      </span>
                      <span>{new Date(notif.created_at).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
