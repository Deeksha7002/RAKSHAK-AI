import React, { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';

interface NotificationToastProps {
    message: string;
    onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onDismiss }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [dismissDirection, setDismissDirection] = useState<'left' | 'right' | null>(null);

    const startX = useRef<number>(0);
    const startTime = useRef<number>(0);
    const cardRef = useRef<HTMLDivElement>(null);

    // Track touch or mouse gesture start
    const handleStart = (clientX: number) => {
        startX.current = clientX;
        startTime.current = Date.now();
        setIsDragging(true);
        setIsDismissing(false);
        setDismissDirection(null);
    };

    // Track active drag movement
    const handleMove = (clientX: number) => {
        if (!isDragging || isDismissing) return;
        const deltaX = clientX - startX.current;
        setOffsetX(deltaX);
    };

    // Finalize gesture and decide whether to dismiss or bounce back
    const handleEnd = () => {
        if (!isDragging || isDismissing) return;
        setIsDragging(false);

        const duration = Date.now() - startTime.current;
        const velocity = Math.abs(offsetX) / (duration || 1); // px per ms

        // Swipe threshold configurations
        const swipeThreshold = 120; // min distance in px
        const flickVelocityThreshold = 0.45; // flick speed px/ms
        const minFlickDistance = 40; // minimum movement to qualify as a fast flick

        const shouldDismiss = 
            Math.abs(offsetX) > swipeThreshold || 
            (velocity > flickVelocityThreshold && Math.abs(offsetX) > minFlickDistance);

        if (shouldDismiss) {
            // Initiate slide-off animation
            const direction = offsetX > 0 ? 'right' : 'left';
            setIsDismissing(true);
            setDismissDirection(direction);
            
            // Satifying click sound
            soundManager.playClick();

            // Trigger light haptics on device if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(15);
            }

            // Fire close callback after transition ends (300ms)
            setTimeout(() => {
                onDismiss();
            }, 300);
        } else {
            // Bounce back to center
            setOffsetX(0);
            
            // Soft vibration click on elastic spring impact
            if (offsetX !== 0 && typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(8);
            }
        }
    };

    // Global desktop mouse listeners when active dragging is triggered
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleMove(e.clientX);
        };

        const handleMouseUp = () => {
            handleEnd();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, offsetX]);

    // Computed visual styles for drag transitions
    // Dynamic Fading: gradually fade out card up to 70% as it's swiped
    const opacity = isDismissing
        ? 0
        : 1 - Math.min(Math.abs(offsetX) / 320, 0.75);

    // Dynamic Scaling: scale card down slightly up to 8% to create tactile depth
    const scale = isDismissing
        ? 0.9
        : 1 - Math.min(Math.abs(offsetX) / 1200, 0.08);

    // Transform position: translate off-screen on dismissal, or shift by current drag delta
    const translateX = isDismissing
        ? (dismissDirection === 'right' ? '120vw' : '-120vw')
        : `${offsetX}px`;

    // Spring Curve Transition: Instant tracking during drag, elastic bounce back or quick slide out otherwise
    const transition = isDragging
        ? 'none'
        : 'transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.25), opacity 0.3s ease, scale 0.3s ease';

    return (
        <div
            ref={cardRef}
            className="notification-toast"
            style={{
                transform: `translateX(calc(-50% + ${translateX})) scale(${scale})`,
                opacity: opacity,
                transition: transition,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none', // Critical: prevents default browser swipe gestures/scrolling during drag
                userSelect: 'none',
                WebkitUserSelect: 'none'
            }}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            onMouseDown={(e) => handleStart(e.clientX)}
        >
            <div className="notification-icon-container">
                <Shield className="notification-shield-icon" size={20} />
            </div>
            <div className="notification-message-content">
                {message}
            </div>
        </div>
    );
};
