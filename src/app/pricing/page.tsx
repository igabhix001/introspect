import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "INTROSPECT™ pricing plans — ₹333/month, ₹1,836/6 months, or ₹3,654/year. All inclusive. Risk assessment, trade journal, position calculator, challenges, and more.",
};

export default function PricingPage() {
  return <PricingContent />;
}
