"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Loader2 } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check role and redirect accordingly
        let isAdmin = false;
        
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          
          isAdmin = profile?.role === "admin";
        } catch {
          // ignore profile fetch errors
        }

        // Fallback: check email for known admin
        if (!isAdmin && data.user.email === "intradaymindview@gmail.com") {
          isAdmin = true;
        }

        // Use window.location for hard redirect to ensure cookies are sent with fresh request
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirect");
        
        if (redirectTo) {
          window.location.href = redirectTo;
        } else if (isAdmin) {
          window.location.href = "/dashboard/admin";
        } else {
          window.location.href = "/dashboard";
        }
        return;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="relative min-h-screen flex">
        <ParticleField count={30} />

        {/* Left: Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="relative z-10 max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="INTROSPECT™" fill className="object-contain" />
              </div>
              <span className="font-heading text-xl font-bold">
                INTROSPECT<span className="text-xs align-super opacity-60">™</span>
              </span>
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              Master Your
              <br />
              Psychology.
              <br />
              <span className="gradient-text">Master the Markets.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-muted-foreground text-lg leading-relaxed"
            >
              Your disciplined trading journey continues here.
              Log in to access your risk profile, trade journal, and daily challenges.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center gap-3 text-xs text-muted-foreground/60"
            >
              <Shield className="h-4 w-4 text-success/50" />
              <span>256-bit Encrypted • Your data is secure</span>
            </motion.div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="INTROSPECT™" fill className="object-contain" />
              </div>
              <span className="font-heading text-lg font-bold">
                INTROSPECT<span className="text-xs align-super opacity-60">™</span>
              </span>
            </Link>

            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/20">
              <h2 className="font-heading text-2xl font-bold mb-2">Welcome back</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Sign in to your INTROSPECT™ account
              </p>

              <form className="space-y-5" onSubmit={handleLogin}>
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="text-sm font-medium mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link href="/auth/forgot-password" className="text-xs text-success hover:text-success/80 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-background/50 border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-border bg-background/50 text-success focus:ring-success/30 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all duration-300 cursor-pointer group disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>


            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-success hover:text-success/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
}
