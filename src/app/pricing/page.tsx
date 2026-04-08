import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing – Less Than One Bad Trade",
  description:
    "INTROSPECT™ costs less than one bad trade. ₹333/month for discipline, risk rules, and accountability. All inclusive.",
};

export default function PricingPage() {
  return <PricingContent />;
}
