"use client";

import Script from "next/script";

// Hotjar Site ID provided by client
const HOTJAR_SITE_ID = 725552;
const HOTJAR_VERSION = 6;

// Declare Hotjar on window
declare global {
  interface Window {
    hj: (...args: unknown[]) => void;
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

// Hotjar tracking functions
export const hotjarIdentify = (userId: string, attributes?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.hj) {
    window.hj("identify", userId, attributes);
  }
};

export const hotjarEvent = (eventName: string) => {
  if (typeof window !== "undefined" && window.hj) {
    window.hj("event", eventName);
  }
};

export const hotjarStateChange = (relativePath: string) => {
  if (typeof window !== "undefined" && window.hj) {
    window.hj("stateChange", relativePath);
  }
};

// Hotjar component - loads the tracking script
export function Hotjar() {
  return (
    <Script
      id="hotjar-tracking"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:${HOTJAR_VERSION}};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

export default Hotjar;
