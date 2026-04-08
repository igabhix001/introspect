"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  read: "bg-amber-500/10 text-amber-500",
  replied: "bg-success/10 text-success",
  archived: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Mail className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  replied: <CheckCircle2 className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
};

export default function AdminMessagesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchSubmissions();
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status: status as ContactSubmission["status"] });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const newCount = submissions.filter((s) => s.status === "new").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-success" />
            Contact Messages
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {submissions.length} total • {newCount} new
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "new", "read", "replied", "archived"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === status
                ? "bg-success text-success-foreground"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => {
                  setSelectedMessage(submission);
                  if (submission.status === "new") {
                    updateStatus(submission.id, "read");
                  }
                }}
                className={`p-4 hover:bg-muted/10 transition-colors cursor-pointer ${
                  submission.status === "new" ? "bg-blue-500/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[submission.status]}`}>
                        {statusIcons[submission.status]}
                        {submission.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{submission.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {submission.name} • {submission.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {submission.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${statusColors[selectedMessage.status]}`}>
                  {statusIcons[selectedMessage.status]}
                  {selectedMessage.status}
                </span>
                <button onClick={() => setSelectedMessage(null)} className="p-1 rounded-lg hover:bg-muted cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="font-heading text-lg font-bold mb-2">{selectedMessage.subject}</h3>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{selectedMessage.name}</span>
                <a href={`mailto:${selectedMessage.email}`} className="text-success hover:underline">
                  {selectedMessage.email}
                </a>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 mb-4">
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <p className="text-[10px] text-muted-foreground mb-4">
                Received: {new Date(selectedMessage.created_at).toLocaleString("en-IN")}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/50">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  onClick={() => updateStatus(selectedMessage.id, "replied")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success text-success-foreground text-xs font-semibold hover:bg-success/90 transition-colors cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reply via Email
                </a>
                {selectedMessage.status !== "replied" && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, "replied")}
                    disabled={actionLoading === selectedMessage.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Replied
                  </button>
                )}
                <button
                  onClick={() => updateStatus(selectedMessage.id, "archived")}
                  disabled={actionLoading === selectedMessage.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
