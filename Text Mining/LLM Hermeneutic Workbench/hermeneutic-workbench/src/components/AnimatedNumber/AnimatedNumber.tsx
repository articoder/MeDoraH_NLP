/**
 * AnimatedNumber Component - Smoothly animates number changes
 */
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatFn?: (n: number) => string;
}

export function AnimatedNumber({
    value,
    duration = 400,
    formatFn = (n) => n.toLocaleString()
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        const startTime = performance.now();

        // Cancel any ongoing animation
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }

        // If no change, skip animation
        if (startValue === endValue) {
            return;
        }

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentValue = Math.round(
                startValue + (endValue - startValue) * easeOut
            );

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                prevValueRef.current = endValue;
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return <>{formatFn(displayValue)}</>;
}
