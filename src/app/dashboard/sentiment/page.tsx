"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SentimentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/calculator");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">
        Redirecting to Sizer & Sentiment Console...
      </p>
    </div>
  );
}
