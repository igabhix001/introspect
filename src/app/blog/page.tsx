import type { Metadata } from "next";
import { BlogContent } from "./blog-content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Trading discipline articles, risk management tips, and market insights. Featuring Discipline Mondays and Risk-First Fridays by Intraday MindView Learning.",
};

export default function BlogPage() {
  return <BlogContent />;
}
