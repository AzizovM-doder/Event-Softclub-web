import React from "react";
import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({ children, delay = 0, direction = "up", className, ...props }) {
  const variants = {
    hidden: { 
      opacity: 0, 
      x: direction === "left" ? -20 : direction === "right" ? 20 : 0, 
      y: direction === "up" ? 20 : direction === "down" ? -20 : 0 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0 
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Scale({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
