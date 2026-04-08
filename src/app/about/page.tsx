import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About – Why I Built This",
  description:
    "I didn't struggle with finding a strategy. I struggled with following it. That's why I built INTROSPECT™ — to help traders stay disciplined.",
};

export default function AboutPage() {
  return <AboutContent />;
}
