import type { Metadata } from "next";
import { DisclaimerContent } from "./disclaimer-content";

export const metadata: Metadata = {
  title: "Disclaimer & Risk Warning | INTROSPECT™",
  description:
    "INTROSPECT™ Disclaimer — Educational risk management software & regulatory compliance notice.",
};

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
