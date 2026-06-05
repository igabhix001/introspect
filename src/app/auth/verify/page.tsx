"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Shield, RefreshCw, AlertTriangle, Loader2, Mail, Check } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";
import { createClient } from "@/lib/supabase/client";

function VerifyContent() {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";

  useEffect(() => {
    // Check for error in URL (e.g., expired link from Supabase)
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    if (errorParam) {
      setError(errorDesc || "The verification link is invalid or has expired.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      setError("Email address not found. Please go back and sign up again.");
      return;
    }
    setResending(true);
    setError(null);

    try {
      const supabase = createClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "https://www.intradaymindview.com");

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => setResendSuccess(false), 4000);
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Show error state if link expired or invalid
  if (error) {
    return (
      <AuroraBackground>
        <div className="relative min-h-screen flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-md"
          >
            <Link href="/" className="inline-flex items-center gap-2 mb-10">
              <div className="relative w-9 h-9">
                <Image src="/logo.png" alt="INTROSPECT™" fill className="object-contain" />
              </div>
              <span className="font-heading text-lg font-bold">
                INTROSPECT<span className="text-xs align-super opacity-60">™</span>
              </span>
            </Link>

            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">Link Expired</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/signup"
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl transition-all duration-300"
                >
                  Try Signing Up Again
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 border border-border hover:bg-muted/50 font-medium py-3 rounded-xl transition-all duration-300"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <ParticleField count={25} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="relative w-9 h-9">
              <Image src="/logo.png" alt="INTROSPECT™" fill className="object-contain" />
            </div>
            <span className="font-heading text-lg font-bold">
              INTROSPECT<span className="text-xs align-super opacity-60">™</span>
            </span>
          </Link>

          <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/20">
            <div className="text-center mb-8">
              {/* Animated envelope */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
              >
                <motion.span
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-3xl"
                  style={{ display: "inline-block" }}
                >
                  📧
                </motion.span>
              </motion.div>

              <h2 className="font-heading text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a verification link to{" "}
                {email ? (
                  <span className="text-foreground font-medium">{email}</span>
                ) : (
                  <span className="text-foreground font-medium">your inbox</span>
                )}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 mb-6 space-y-2.5">
              {[
                "Open the email from INTROSPECT™",
                'Click the "Confirm your email" button',
                "You will be automatically signed in",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-success text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>

            {/* Resend section */}
            <div className="text-center">
              {resendSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-success text-sm font-medium"
                >
                  <Check className="h-4 w-4" />
                  New verification email sent!
                </motion.div>
              ) : canResend ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-sm text-success hover:text-success/80 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {resending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  Didn&apos;t receive it? Resend in{" "}
                  <span className="text-muted-foreground font-mono">
                    {countdown}s
                  </span>
                </p>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground/50 mt-4">
              Check your spam folder if you don&apos;t see it within 2 minutes.
            </p>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
              <Shield className="h-3.5 w-3.5 text-success/50" />
              256-bit Encrypted
            </div>
          </div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
