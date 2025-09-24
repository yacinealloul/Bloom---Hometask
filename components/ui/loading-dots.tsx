import React from "react";
import { motion } from "framer-motion";

interface LoadingDotsProps {
    className?: string;
}

export default function LoadingDots({ className = "" }: LoadingDotsProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <motion.div
                animate={{
                    opacity: [0.4, 1, 0.4],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="w-1 h-1 bg-current rounded-full"
            />
            <motion.div
                animate={{
                    opacity: [0.4, 1, 0.4],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                }}
                className="w-1 h-1 bg-current rounded-full"
            />
            <motion.div
                animate={{
                    opacity: [0.4, 1, 0.4],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                }}
                className="w-1 h-1 bg-current rounded-full"
            />
        </div>
    );
}