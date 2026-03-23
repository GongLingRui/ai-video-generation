"use client"

import { motion } from "framer-motion"

const orbs = [
  { size: 350, x: "5%", y: "15%", hue: "20, 100%, 55%", delay: 0, duration: 10 },
  { size: 280, x: "65%", y: "5%", hue: "15, 100%, 60%", delay: 1, duration: 12 },
  { size: 220, x: "75%", y: "55%", hue: "20, 100%, 55%", delay: 2, duration: 9 },
  { size: 200, x: "15%", y: "65%", hue: "15, 100%, 60%", delay: 0.5, duration: 11 },
  { size: 160, x: "45%", y: "30%", hue: "20, 100%, 50%", delay: 1.5, duration: 13 },
]

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(${orb.hue} / 0.08), transparent 70%)`,
          }}
          animate={{
            y: [0, -25, 0, 18, 0],
            x: [0, 12, -8, 5, 0],
            scale: [1, 1.06, 0.94, 1.03, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  )
}
