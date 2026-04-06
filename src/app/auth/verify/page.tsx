"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Shield, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";

function VerifyContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check for error in URL (e.g., expired link)
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    
    if (errorParam) {
      setError(errorDesc || "The link is invalid or has expired.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0 && !error) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, error]);

  // Show error state if link expired
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
              <p className="text-sm text-muted-foreground mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl transition-all duration-300"
                >
                  Request New Link
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

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((v) => !v);
    inputs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleResend = () => {
    setCountdown(45);
    setCanResend(false);
  };

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

              <h2 className="font-heading text-2xl font-bold mb-2">Verify Your Email</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a 6-digit code to{" "}
                <span className="text-foreground font-medium">your@email.com</span>
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* OTP Input */}
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border transition-all duration-200 bg-background/50 focus:outline-none ${
                      digit
                        ? "border-success/40 ring-1 ring-success/20"
                        : "border-border focus:border-success/40 focus:ring-1 focus:ring-success/20"
                    }`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all duration-300 cursor-pointer group"
              >
                Verify Code
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Resend */}
            <div className="text-center mt-6">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-sm text-success hover:text-success/80 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Resend code
                </button>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  Didn&apos;t receive the code?{" "}
                  <span className="text-muted-foreground font-mono">
                    0:{countdown.toString().padStart(2, "0")}
                  </span>
                </p>
              )}
            </div>

            <div className="text-center mt-4">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Change email address
              </Link>
            </div>
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
