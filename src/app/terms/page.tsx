import type { Metadata } from "next";
import { TermsContent } from "./terms-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "INTROSPECT™ Terms of Service — rules, responsibilities, and usage guidelines. By Intraday MindView Learning.",
};

export default function TermsPage() {
  return <TermsContent />;
}
