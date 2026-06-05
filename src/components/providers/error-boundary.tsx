"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AuthErrorBoundary] Uncaught auth error:", error, errorInfo);
  }

  private handleReset = () => {
    // Clear storage cache in case corrupt data caused the crash
    try {
      sessionStorage.removeItem("introspect_auth_cache");
      localStorage.removeItem("introspect_auth_cache");
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.replace("/auth/login");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-2xl border border-border bg-card shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Connection Interrupted</h2>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error occurred while verifying your session. This might be due to a brief database connection drop or stale credentials.
            </p>
            {this.state.error && (
              <div className="p-3 mb-6 rounded-lg bg-muted/50 border border-border/50 text-left text-xs font-mono overflow-auto max-h-24 text-muted-foreground">
                {this.state.error.message || "Unknown auth exception"}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Reset & Sign In Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
