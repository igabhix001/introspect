"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

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
            {!submitted ? (
              <>
                <h2 className="font-heading text-2xl font-bold mb-2">Reset Password</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Enter your email address and we&apos;ll send you a verification code to reset your password.
                </p>

                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div>
                    <label htmlFor="reset-email" className="text-sm font-medium mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] transition-all duration-300 cursor-pointer group"
                  >
                    Send Reset Code
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-7 w-7 text-success" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We&apos;ve sent a verification code to your email address. Enter the code on the next screen.
                </p>
                <Link
                  href="/auth/verify"
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all duration-300 cursor-pointer group"
                >
                  Enter Code
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            )}
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
