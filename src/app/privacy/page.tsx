import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "INTROSPECT™ Privacy Policy — how we collect, use, and protect your data. By Intraday MindView Learning.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
