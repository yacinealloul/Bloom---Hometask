"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "motion/react";
import GrainyGradient from "@/components/background/grainy-gradient";

interface Ripple {
    id: number;
    x: number;
    y: number;
    startTime: number;
}

export default function InteractiveBackground() {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const rippleIdRef = useRef(0);

    const addRippleAt = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const newRipple: Ripple = {
            id: rippleIdRef.current++,
            x,
            y,
            startTime: currentTime,
        };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 1500);
    };

    useEffect(() => {
        const onWindowClick = (e: MouseEvent) => {
            addRippleAt(e.clientX, e.clientY);
        };
        const onProgrammaticRipple = (e: Event) => {
            const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
            if (detail && typeof detail.x === "number" && typeof detail.y === "number") {
                addRippleAt(detail.x, detail.y);
            }
        };
        window.addEventListener("click", onWindowClick);
        window.addEventListener("bg:ripple", onProgrammaticRipple as EventListener);
        return () => {
            window.removeEventListener("click", onWindowClick);
            window.removeEventListener("bg:ripple", onProgrammaticRipple as EventListener);
        };
    }, [currentTime]);

    return (
        <motion.div
            ref={containerRef}
            className="fixed inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
            <Canvas camera={{ position: [0, 0, 1] }} gl={{ preserveDrawingBuffer: true }}>
                <GrainyGradient ripples={ripples} onTimeUpdate={setCurrentTime} />
            </Canvas>
        </motion.div>
    );
}


