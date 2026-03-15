"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Search,
  Users,
  Award,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminPointsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totals, setTotals] = useState({ issued: 0, redeemed: 0, members: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        
        // In a real app, an admin route would fetch via a protected API 
        // /api/admin/points to bypass RLS, or RLS would allow admins to read.
        // Assuming RLS allows admins to read all loyalty_points and profiles.
        
        const { data: usersCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact" });
          
        const { data: pointsData } = await supabase
          .from("loyalty_points")
          .select(`
            *,
            profiles(full_name, email)
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (pointsData) {
          setTransactions(pointsData);
          
          let issued = 0;
          let redeemed = 0;
          pointsData.forEach((tx) => {
            if (tx.points > 0) issued += tx.points;
            else redeemed += Math.abs(tx.points);
          });
          
          setTotals({
            issued: issued * 10, // Mock multiplier for global view
            redeemed: redeemed * 5,
            members: usersCount?.length || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching admin points data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((tx) => 
    tx.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Points <span className="gradient-text">Engine</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Global loyalty activity, redemptions, and point issuance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border/50 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Points Issued</p>
          </div>
          <h2 className="text-3xl font-heading font-bold">{totals.issued.toLocaleString()}</h2>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/50 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Points Redeemed</p>
          </div>
          <h2 className="text-3xl font-heading font-bold">{totals.redeemed.toLocaleString()}</h2>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/50 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Active Members</p>
          </div>
          <h2 className="text-3xl font-heading font-bold">{totals.members.toLocaleString()}</h2>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden glass-card">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-heading font-semibold">Recent Transactions</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {tx.profiles?.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{tx.profiles?.full_name || "Unknown User"}</div>
                        <div className="text-xs text-muted-foreground">{tx.profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{tx.description || tx.action || "System"}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4">
                      {tx.action_type || "reward"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${
                      tx.points > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? "No transactions found matching your search." : "No transactions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
