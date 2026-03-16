import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INTROSPECT™ – The Risk Guardian for Intraday Traders",
    short_name: "INTROSPECT",
    description:
      "Build discipline, manage risk, and protect your capital with personalized rules and coaching for intraday traders.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#10b981",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["finance", "education", "productivity"],
    lang: "en",
    dir: "ltr",
  };
}
