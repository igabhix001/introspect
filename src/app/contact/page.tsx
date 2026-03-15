import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Intraday MindView Learning team. Questions about INTROSPECT™, coaching, or partnerships? We'd love to hear from you.",
};

export default function ContactPage() {
  return <ContactContent />;
}
