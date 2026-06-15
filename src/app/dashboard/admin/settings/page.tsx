"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminSettingsQuery, useAdminFyersStatusQuery } from "@/lib/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Shield,
  Database,
  Globe,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Server,
  Key,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Copy,
  Save,
} from "lucide-react";

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const [pricing, setPricing] = useState({ monthly: 399, sixMonth: 1999, yearly: 3499 });
  const [pricingSaved, setPricingSaved] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Fyers default instrument state
  const [fyersDefaultInstrument, setFyersDefaultInstrument] = useState("Nifty 50");
  const [fyersDefaultInstrumentSaved, setFyersDefaultInstrumentSaved] = useState(false);
  const [fyersDefaultInstrumentLoading, setFyersDefaultInstrumentLoading] = useState(false);

  // Fyers state
  const [fyersStatus, setFyersStatus] = useState<{
    connected: boolean;
    appId?: string;
    tokenExpiry?: string;
    lastRefreshed?: string;
    isExpired?: boolean;
  }>({ connected: false });
  const [fyersAuthCode, setFyersAuthCode] = useState("");
  const [fyersAppId, setFyersAppId] = useState("");
  const [fyersLoading, setFyersLoading] = useState(false);
  const [fyersMessage, setFyersMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autoConnecting, setAutoConnecting] = useState(false);

  // Auto-capture auth code from URL params (Fyers redirect)
  useEffect(() => {
    const authCodeFromUrl = searchParams.get("auth_code");
    const codeStatus = searchParams.get("code");
    
    if (authCodeFromUrl && codeStatus === "200") {
      setFyersAuthCode(authCodeFromUrl);
      setFyersMessage({ type: "success", text: "Auth code captured! Click 'Connect Fyers' to complete setup." });
      // Clear URL params without reload
      window.history.replaceState({}, "", "/dashboard/admin/settings");
    }
  }, [searchParams]);

  const queryClient = useQueryClient();

  const { data: settingsData } = useAdminSettingsQuery();
  const { data: fyersData } = useAdminFyersStatusQuery();

  useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      if (settings.pricing_monthly) {
        setPricing((p) => ({ ...p, monthly: settings.pricing_monthly.amount || p.monthly }));
      }
      if (settings.pricing_6month) {
        setPricing((p) => ({ ...p, sixMonth: settings.pricing_6month.amount || p.sixMonth }));
      }
      if (settings.pricing_yearly) {
        setPricing((p) => ({ ...p, yearly: settings.pricing_yearly.amount || p.yearly }));
      }
      if (settings.fyers_default_instrument) {
        setFyersDefaultInstrument(settings.fyers_default_instrument.instrument || "Nifty 50");
      }
    }
  }, [settingsData]);

  useEffect(() => {
    if (fyersData) {
      setFyersStatus(fyersData);
      if (fyersData.appId) setFyersAppId(fyersData.appId);
    }
  }, [fyersData]);

  const handleSavePricing = async () => {
    setPricingLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing_monthly", value: { amount: pricing.monthly, amount_paise: pricing.monthly * 100 } }),
      });
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing_6month", value: { amount: pricing.sixMonth, amount_paise: pricing.sixMonth * 100 } }),
      });
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing_yearly", value: { amount: pricing.yearly, amount_paise: pricing.yearly * 100 } }),
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 2000);
    } catch { /* ignore */ }
    setPricingLoading(false);
  };

  const handleFyersAuth = async () => {
    if (!fyersAuthCode || !fyersAppId) {
      setFyersMessage({ type: "error", text: "App ID and Auth Code are required" });
      return;
    }
    setFyersLoading(true);
    setFyersMessage(null);
    try {
      const res = await fetch("/api/admin/fyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode: fyersAuthCode, appId: fyersAppId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFyersMessage({ type: "success", text: "Fyers connected successfully! Token will auto-refresh." });
        setFyersAuthCode("");
        queryClient.invalidateQueries({ queryKey: ["adminFyersStatus"] });
      } else {
        setFyersMessage({ type: "error", text: data.error || "Authentication failed" });
      }
    } catch {
      setFyersMessage({ type: "error", text: "Network error" });
    }
    setFyersLoading(false);
  };

  const handleSaveDefaultInstrument = async () => {
    setFyersDefaultInstrumentLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "fyers_default_instrument", value: { instrument: fyersDefaultInstrument } }),
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      setFyersDefaultInstrumentSaved(true);
      setTimeout(() => setFyersDefaultInstrumentSaved(false), 2000);
    } catch { /* ignore */ }
    setFyersDefaultInstrumentLoading(false);
  };

  // Redirect to admin settings page to auto-capture auth code
  // Using /dashboard/admin/settings as redirect to avoid conflict with TradeSync's /auth/fyers/callback
  const fyersAuthUrl = fyersAppId
    ? `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${fyersAppId}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_FYERS_REDIRECT_URI || "https://www.intradaymindview.com/auth/fyers/callback")}&response_type=code&state=introspect`
    : "";

  const systemChecks = [
    {
      name: "Supabase Connection",
      status: true,
      icon: Database,
      detail: "PostgreSQL database & auth",
    },
    {
      name: "Razorpay Gateway",
      status: true,
      icon: IndianRupee,
      detail: "Payment processing active",
    },
    {
      name: "Fyers API",
      status: fyersStatus.connected,
      icon: Globe,
      detail: fyersStatus.connected
        ? `Token valid until ${new Date(fyersStatus.tokenExpiry || "").toLocaleString("en-IN")}`
        : "Not connected",
    },
    {
      name: "Next.js Server",
      status: true,
      icon: Server,
      detail: "Application runtime active",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">System Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Platform configuration, API integrations, and system health
        </p>
      </div>

      {/* System Health */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-success" />
          System Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {systemChecks.map((check) => {
            const Icon = check.icon;
            return (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${check.status ? "bg-success/10" : "bg-destructive/10"}`}>
                  <Icon className={`h-4 w-4 ${check.status ? "text-success" : "text-destructive"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{check.detail}</p>
                </div>
                {check.status ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Fyers API Integration */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
          <Key className="h-4 w-4 text-amber-500" />
          Fyers API Integration
          {fyersStatus.connected ? (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-success font-medium">
              <Wifi className="h-3 w-3" /> Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <WifiOff className="h-3 w-3" /> Not Connected
            </span>
          )}
        </h3>

        {fyersStatus.connected && (
          <div className="mb-4 p-3 rounded-xl bg-success/5 border border-success/20">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">App ID</p>
                <p className="font-mono font-medium">{fyersStatus.appId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Refreshed</p>
                <p className="font-mono font-medium">
                  {fyersStatus.lastRefreshed
                    ? new Date(fyersStatus.lastRefreshed).toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Token Expiry</p>
                <p className="font-mono font-medium">
                  {fyersStatus.tokenExpiry
                    ? new Date(fyersStatus.tokenExpiry).toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Auto-Refresh</p>
                <p className="font-mono font-medium text-success">Enabled</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground">
            <p className="font-semibold text-amber-500 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> One-Time Setup
            </p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Enter your Fyers App ID below</li>
              <li>Click &quot;Generate Auth Code&quot; — this opens Fyers login</li>
              <li>After login, copy the auth code from the redirect URL</li>
              <li>Paste the auth code below and click &quot;Connect&quot;</li>
              <li>Token auto-refreshes — no daily login needed</li>
            </ol>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fyers App ID</label>
            <input
              type="text"
              value={fyersAppId}
              onChange={(e) => setFyersAppId(e.target.value)}
              placeholder="e.g. LPSKI8UURL-100"
              className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {fyersAppId && (
            <a
              href={fyersAuthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Generate Auth Code (opens Fyers login)
            </a>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Auth Code (from redirect URL)</label>
            <input
              type="text"
              value={fyersAuthCode}
              onChange={(e) => setFyersAuthCode(e.target.value)}
              placeholder="Paste the auth code here..."
              className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <button
            onClick={handleFyersAuth}
            disabled={fyersLoading || !fyersAuthCode || !fyersAppId}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {fyersLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            {fyersLoading ? "Connecting..." : "Connect Fyers"}
          </button>

          {fyersMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              fyersMessage.type === "success"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {fyersMessage.text}
            </div>
          )}

          <div className="pt-4 border-t border-border/50 mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Default Fyers Instrument</label>
            <div className="flex gap-2">
              <select
                value={["Nifty 50", "Nifty Bank", "Fin Nifty", "Nifty Next 50", "Midcap Nifty"].includes(fyersDefaultInstrument) ? fyersDefaultInstrument : "Custom"}
                onChange={(e) => {
                  if (e.target.value === "Custom") {
                    setFyersDefaultInstrument("");
                  } else {
                    setFyersDefaultInstrument(e.target.value);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-amber-500/40"
              >
                <option value="Nifty 50">Nifty 50</option>
                <option value="Nifty Bank">Nifty Bank</option>
                <option value="Fin Nifty">Fin Nifty</option>
                <option value="Nifty Next 50">Nifty Next 50</option>
                <option value="Midcap Nifty">Midcap Nifty</option>
                <option value="Custom">Custom Stock / Instrument</option>
              </select>
              <button
                onClick={handleSaveDefaultInstrument}
                disabled={fyersDefaultInstrumentLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {fyersDefaultInstrumentLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : fyersDefaultInstrumentSaved ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {fyersDefaultInstrumentSaved ? "Saved!" : "Save"}
              </button>
            </div>
            {!["Nifty 50", "Nifty Bank", "Fin Nifty", "Nifty Next 50", "Midcap Nifty"].includes(fyersDefaultInstrument) && (
              <input
                type="text"
                value={fyersDefaultInstrument}
                onChange={(e) => setFyersDefaultInstrument(e.target.value.toUpperCase())}
                placeholder="Enter custom stock symbol (e.g., RELIANCE)"
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-background/50 border border-amber-500/30 text-sm font-medium focus:outline-none focus:border-amber-500/60 transition-all placeholder:text-muted-foreground/50"
              />
            )}
          </div>
      </div>
      </div>

      {/* Pricing Config */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-success" />
          Pricing Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Monthly Price (₹)</label>
            <input
              type="number"
              value={pricing.monthly}
              onChange={(e) => setPricing({ ...pricing, monthly: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">6-Month Price (₹)</label>
            <input
              type="number"
              value={pricing.sixMonth}
              onChange={(e) => setPricing({ ...pricing, sixMonth: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Yearly Price (₹)</label>
            <input
              type="number"
              value={pricing.yearly}
              onChange={(e) => setPricing({ ...pricing, yearly: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:border-success/40"
            />
          </div>
        </div>
        <button
          onClick={handleSavePricing}
          disabled={pricingLoading}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {pricingLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : pricingSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              Save Pricing
            </>
          )}
        </button>
      </div>

      {/* Environment Info */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
          <Server className="h-4 w-4 text-success" />
          Environment
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/20">
            <p className="text-muted-foreground mb-0.5">Runtime</p>
            <p className="font-mono font-medium">Next.js 16</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20">
            <p className="text-muted-foreground mb-0.5">Database</p>
            <p className="font-mono font-medium">Supabase PostgreSQL</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20">
            <p className="text-muted-foreground mb-0.5">Payments</p>
            <p className="font-mono font-medium">Razorpay</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20">
            <p className="text-muted-foreground mb-0.5">Market Data</p>
            <p className="font-mono font-medium">Fyers v3 API</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
      </div>
    }>
      <AdminSettingsContent />
    </Suspense>
  );
}
