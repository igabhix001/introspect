"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  subtitle?: string;
  isShort?: boolean;
}

/**
 * Production-grade YouTube embed component
 * - Lazy loads iframe on user interaction (better performance)
 * - Responsive design with theme-matching styling
 * - Supports both regular videos and YouTube Shorts
 * - Privacy-enhanced embed (youtube-nocookie.com)
 */
export function YouTubeEmbed({ 
  videoId, 
  title, 
  subtitle,
  isShort = false 
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // For shorts, use different aspect ratio
  const aspectClass = isShort ? "aspect-[9/16] max-w-[320px]" : "aspect-video";
  
  // Thumbnail URL - use maxresdefault for best quality
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  
  // Privacy-enhanced embed URL
  const embedUrl = isShort 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="w-full">
      {/* Optional title and subtitle */}
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Video container */}
      <div className={`relative ${aspectClass} mx-auto rounded-2xl overflow-hidden border border-border bg-card shadow-2xl shadow-black/20`}>
        {!isPlaying ? (
          // Thumbnail with play button overlay
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full group cursor-pointer"
            aria-label="Play video"
          >
            {/* Thumbnail image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Pulse animation */}
                <div className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
                {/* Button */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>

            {/* Watch label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs sm:text-sm font-medium border border-white/20">
                ▶ Watch Video
              </span>
            </div>
          </button>
        ) : (
          // Actual YouTube iframe (loaded on click)
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Extracts video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
