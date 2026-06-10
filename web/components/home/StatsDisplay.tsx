"use client";

import { motion, useReducedMotion } from "motion/react";

interface StatItem {
  label: string;
  value: number;
  color: string;
}

export function StatsDisplay({ items }: { items: StatItem[] }) {
  const reduce = useReducedMotion();

  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        width: "min(1320px, 92%)",
        margin: "0 auto",
        padding: "0 0 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 60,
          flexWrap: "wrap",
          padding: "40px 0",
        }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              textAlign: "center",
            }}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.1 + 0.3 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: item.color,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {item.value}
            </motion.div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-dim)",
              }}
            >
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
