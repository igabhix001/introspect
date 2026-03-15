import { redirect } from "next/navigation";
import { Key } from "lucide-react";

export default async function FyersCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  // Fyers v3 returns `code=200` for success, and the actual token in `auth_code`
  let authCode = typeof resolvedParams.auth_code === "string" ? resolvedParams.auth_code : null;
  
  // Fallback just in case Fyers drops it in `code` but not `200`
  if (!authCode && typeof resolvedParams.code === "string" && resolvedParams.code !== "200" && resolvedParams.code !== "ok") {
    authCode = resolvedParams.code;
  }
  
  const errorMsg = typeof resolvedParams.message === "string" ? resolvedParams.message : null;

  if (errorMsg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 max-w-md w-full">
          <h2 className="text-destructive font-bold mb-2">Fyers Authorization Failed</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!authCode) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
        <p className="animate-pulse text-muted-foreground">Waiting for Fyers response...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 max-w-xl w-full">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mb-6">
          <Key className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Authorization Successful!</h1>
        <p className="text-sm text-muted-foreground mb-8">
          You have successfully authenticated with Fyers. Please copy the auth code below and paste it into the Introspect system settings.
        </p>
        
        <div className="text-left">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
            Your Auth Code
          </label>
          <div className="relative group">
            <input 
              readOnly 
              value={authCode} 
              className="w-full rounded-xl border border-amber-500/30 bg-background/50 px-4 py-4 text-sm font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="mt-8 text-xs text-muted-foreground">
          You can close this tab and return to the dashboard.
        </div>
      </div>
    </div>
  );
}
