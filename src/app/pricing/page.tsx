import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "INTROSPECT™ pricing plans — ₹333/month or ₹3,663/year. Risk assessment, trade journal, position calculator, challenges, and more. Invest in your trading discipline.",
};

export default function PricingPage() {
  return <PricingContent />;
}
