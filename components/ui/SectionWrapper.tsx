"use client";

import { motion } from "framer-motion";

interface SectionWrapperProps {
  title: string;
  source?: string;
  children: React.ReactNode;
}

export default function SectionWrapper({ title, source, children }: SectionWrapperProps) {
  return (
    <motion.div
      className="stat-section"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <h3>{title}</h3>
      {children}
      {source && (
        <div className="section-source">{source}</div>
      )}
    </motion.div>
  );
}
