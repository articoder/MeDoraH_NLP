import React, { useState, useEffect, useRef } from 'react';
import './AnimatedPanel.css';

interface AnimatedPanelProps {
    isVisible: boolean;
    children: React.ReactNode;
    className?: string;
    id?: string;
    delay?: number; // Optional stagger delay
}

/**
 * AnimatedPanel - A wrapper component that provides smooth enter/exit animations
 * for sidebar panels. Handles the timing of DOM removal to allow exit animations
 * to complete before unmounting.
 */
const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
    isVisible,
    children,
    className = '',
    id,
    delay = 0
}) => {
    // Initialize shouldRender based on initial visibility
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [animationClass, setAnimationClass] = useState(isVisible ? 'panel-enter' : '');
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track previous visibility to detect changes
    const prevVisibleRef = useRef(isVisible);

    useEffect(() => {
        // Clear any pending timeout
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }

        if (isVisible) {
            // SHOW:
            // 1. Mount the component (if not already)
            // 2. Add enter class (after a brief delay to ensure DOM render)
            setShouldRender(true);

            // If we are mounting, give it a tick to render before animating
            requestAnimationFrame(() => {
                setAnimationClass('panel-enter');
            });
        } else {
            // HIDE:
            // 1. Only animate exit if we were previously visible (prevent exit anim on initial load)
            if (prevVisibleRef.current) {
                setAnimationClass('panel-exit');
                // 2. Unmount after animation finishes
                // Add delay to ensure the animation completes if there is a staggered delay
                animationTimeoutRef.current = setTimeout(() => {
                    setShouldRender(false);
                }, 350 + delay); // Match CSS animation duration + stagger delay
            } else {
                setShouldRender(false);
            }
        }

        prevVisibleRef.current = isVisible;

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [isVisible]);

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            className={`animated-panel ${animationClass} ${className}`}
            id={id}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default AnimatedPanel;
