"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  Trash2,
  Moon,
  Sun,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/auth-context";
import { useProfileSettings } from "@/lib/hooks/use-dashboard-data";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfileSettings();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [tradingCapital, setTradingCapital] = useState("");
  const [preferredInstruments, setPreferredInstruments] = useState("");
  const [defaultRisk, setDefaultRisk] = useState("");

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Daily Discipline Reminder": true,
    "Rule Break Alerts": true,
    "End-of-Day Report": true,
    "Weekly Analytics Email": false,
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setTradingCapital(profile.trading_capital?.toString() || "100000");
      setPreferredInstruments(profile.preferred_instruments || "NIFTY, BANKNIFTY");
      setDefaultRisk(profile.default_risk?.toString() || "1");
    }
  }, [profile]);

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName,
      phone: phone || null,
      trading_capital: parseFloat(tradingCapital) || 100000,
      preferred_instruments: preferredInstruments,
      default_risk: parseFloat(defaultRisk) || 1,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
    // In production, call a server-side function to delete the user
    await signOut();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Profile Section */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Profile</h3>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              "Saved ✓"
            ) : (
              <>
                <Save className="h-3 w-3" />
                Save
              </>
            )}
          </button>
        </div>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-sm text-right bg-transparent border-none focus:outline-none text-muted-foreground focus:text-foreground w-48"
              placeholder="Your full name"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Email</label>
            <span className="text-sm text-muted-foreground">
              {user?.email || ""}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-sm text-right bg-transparent border-none focus:outline-none text-muted-foreground focus:text-foreground w-48"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50 bg-muted/20">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Trading Preferences</h3>
        </div>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Default Risk %</label>
            <input
              value={defaultRisk}
              onChange={(e) => setDefaultRisk(e.target.value)}
              className="text-sm text-right bg-transparent border-none focus:outline-none text-muted-foreground focus:text-foreground w-24"
              placeholder="1"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Default Capital (₹)</label>
            <input
              value={tradingCapital}
              onChange={(e) => setTradingCapital(e.target.value)}
              className="text-sm text-right bg-transparent border-none focus:outline-none text-muted-foreground focus:text-foreground w-32"
              placeholder="100000"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <label className="text-sm font-medium">Preferred Instruments</label>
            <input
              value={preferredInstruments}
              onChange={(e) => setPreferredInstruments(e.target.value)}
              className="text-sm text-right bg-transparent border-none focus:outline-none text-muted-foreground focus:text-foreground w-48"
              placeholder="NIFTY, BANKNIFTY"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50 bg-muted/20">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <div className="divide-y divide-border/50">
          {Object.entries(toggles).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
              </div>
              <button
                onClick={() => handleToggle(label)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  value ? "bg-success" : "bg-muted"
                }`}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ left: value ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50 bg-muted/20">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Appearance</h3>
        </div>
        <div className="px-5 py-4">
          <div className="flex gap-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  theme === t
                    ? "border-success bg-success/[0.06] text-success"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {t === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : t === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-destructive/10">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-destructive">
            Danger Zone
          </h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
