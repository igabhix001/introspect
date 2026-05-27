"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Sun, Moon, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/auth-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-to-use", label: "How to Use" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user, loading, isAdmin, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-2 bg-background/80 glass border-b border-border/50 shadow-lg shadow-black/5"
          : "py-4 bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="INTROSPECT™ Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight">
              INTROSPECT
              <span className="text-xs align-super ml-0.5 opacity-60">™</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group cursor-pointer"
              >
                {link.label}
                <span className="absolute inset-x-3 -bottom-px h-px bg-success scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors duration-200 cursor-pointer"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: 90, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: -90, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}

            {/* Desktop Auth/CTA — changes based on login state */}
            <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-border pl-4">
              {loading ? (
                <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
              ) : user ? (
                <>
                  <Link
                    href={isAdmin ? "/dashboard/admin" : "/dashboard"}
                    className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm px-5 py-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all duration-200 cursor-pointer group"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-1 bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all duration-200 cursor-pointer group"
                  >
                    Sign up free
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                  className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
              <SheetContent side="right" className="w-80 pt-12 border-l-border bg-background/95 backdrop-blur-xl">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                  
                  <div className="mt-6 flex flex-col gap-3 px-4 pt-6 border-t border-border">
                    {loading ? (
                      <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                    ) : user ? (
                      <>
                        <Link
                          href={isAdmin ? "/dashboard/admin" : "/dashboard"}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 w-full bg-success hover:bg-success/90 text-success-foreground font-semibold py-3 rounded-lg cursor-pointer transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Go to Dashboard
                        </Link>
                        <button
                          onClick={async () => {
                            setMobileOpen(false);
                            await signOut();
                          }}
                          className="flex items-center justify-center gap-2 w-full bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-medium py-3 rounded-lg cursor-pointer transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center w-full bg-muted/50 hover:bg-muted text-foreground font-medium py-3 rounded-lg cursor-pointer transition-colors"
                        >
                          Log in
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center w-full bg-success hover:bg-success/90 text-success-foreground font-semibold py-3 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.15)] cursor-pointer transition-colors"
                        >
                          Sign up free
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
