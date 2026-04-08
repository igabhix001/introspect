import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about INTROSPECT™? Reach us on WhatsApp or email. We typically respond within 2-4 hours during market hours.",
};

export default function ContactPage() {
  return <ContactContent />;
}
