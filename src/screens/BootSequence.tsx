import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BootSequence.css';

interface BootSequenceProps {
    onComplete: () => void;
}

const BOOT_MESSAGES = [
    { text: 'Vranov Music OS (C) 2024-2026', delay: 0 },
    { text: '', delay: 200 },
    { text: 'Loading VRANOV.SYS...', delay: 400 },
    { text: 'Initializing VM_MUSIC.DLL...', delay: 800 },
    { text: 'MIDDLE EUROPE CONTINENT DETECTED', delay: 1200 },
    { text: 'Checking system resources... OK', delay: 1600 },
    { text: 'Loading sound drivers... OK', delay: 2000 },
    { text: 'Mounting ARCHIVE volume... OK', delay: 2400 },
    { text: 'Connecting to streaming services... OK', delay: 2800 },
    { text: '', delay: 3200 },
    { text: 'Starting Vranov Music OS shell...', delay: 3400 },
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Show lines progressively
        BOOT_MESSAGES.forEach((msg, index) => {
            setTimeout(() => {
                setVisibleLines(index + 1);
                setProgress(Math.min(100, ((index + 1) / BOOT_MESSAGES.length) * 100));
            }, msg.delay);
        });

        // Complete boot after all messages
        const totalTime = BOOT_MESSAGES[BOOT_MESSAGES.length - 1].delay + 800;
        const timer = setTimeout(onComplete, totalTime);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                className="boot-sequence"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* CRT Screen Effect */}
                <div className="boot-screen">
                    {/* VM ASCII Logo */}
                    <pre className="boot-logo">
                        {`
    ╔═══════════════════╗
    ║                   ║
    ║   ██╗   ██╗███╗   ██╗
    ║   ██║   ██║████╗ ████║
    ║   ╚██╗ ██╔╝██╔████╔██║
    ║    ╚████╔╝ ██║╚██╔╝██║
    ║     ╚═══╝  ╚═╝ ╚═╝ ╚═╝
    ║                   ║
    ╚═══════════════════╝
`}
                    </pre>

                    {/* Boot Messages */}
                    <div className="boot-messages mono-text">
                        {BOOT_MESSAGES.slice(0, visibleLines).map((msg, index) => (
                            <div key={index} className="boot-line">
                                {msg.text}
                                {index === visibleLines - 1 && msg.text && (
                                    <span className="cursor animate-blink">_</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="boot-progress">
                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="progress-text mono-text">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Scanlines */}
                <div className="crt-overlay" />
            </motion.div>
        </AnimatePresence>
    );
};
