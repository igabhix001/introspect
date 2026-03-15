import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Intraday MindView Learning and the INTROSPECT™ mission — helping intraday traders build discipline, manage risk, and protect capital.",
};

export default function AboutPage() {
  return <AboutContent />;
}
