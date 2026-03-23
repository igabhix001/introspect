"use client";

import { YouTubeEmbed } from "@/components/ui/youtube-embed";

/**
 * Video Section for Home and About pages
 * Features the INTROSPECT introduction video
 */
export function VideoSection() {
  // YouTube Shorts video ID extracted from: https://www.youtube.com/shorts/nvLK9HtIJk0
  const videoId = "nvLK9HtIJk0";

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/5 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-success/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-success/3 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <YouTubeEmbed
          videoId={videoId}
          title="See INTROSPECT in Action"
          subtitle="Watch how traders are transforming their discipline and achieving consistent results with our AI-powered trading psychology platform."
          isShort={true}
        />
      </div>
    </section>
  );
}
