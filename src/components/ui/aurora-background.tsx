"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";

const COLORS = ["#22C55E", "#10B981", "#059669", "#14B8A6", "#0EA5E9"];

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  const color = useMotionValue(COLORS[0]);

  useEffect(() => {
    const controls = animate(color, COLORS, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
    return controls.stop;
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, var(--color-background) 50%, ${color})`;

  return (
    <motion.div
      style={{ backgroundImage }}
      className="relative overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
