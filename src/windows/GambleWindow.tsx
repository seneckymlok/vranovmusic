import React, { useState, useEffect } from 'react';
import './GambleWindow.css';

// Symbols for the slot machine
const SYMBOLS = ['💿', '🐍', '💀', '🎤', '👁️', '7️⃣'];
const DISCOUNT_CODE = 'VRANOV_STYLE_25';
const WIN_CHANCE = 0.001; // 0.1% chance - Extremely small as requested
// const WIN_CHANCE = 0.5; // Testing only

interface GambleState {
    spinsRemaining: number;
    lastSpinDate: string;
}

export const GambleWindow: React.FC = () => {
    const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
    const [isSpinning, setIsSpinning] = useState(false);
    const [message, setMessage] = useState<string>('PRESS SPIN TO PLAY');
    const [spinsLeft, setSpinsLeft] = useState<number>(3);
    const [winType, setWinType] = useState<'none' | 'win' | 'lose'>('none');

    // Load state from local storage
    useEffect(() => {
        const today = new Date().toDateString();
        const savedState = localStorage.getItem('vranov_gamble_state');

        if (savedState) {
            const parsed: GambleState = JSON.parse(savedState);
            if (parsed.lastSpinDate === today) {
                setSpinsLeft(parsed.spinsRemaining);
            } else {
                // New day, reset spins
                resetSpins(today);
            }
        } else {
            // First time
            resetSpins(today);
        }
    }, []);

    const resetSpins = (dateString: string) => {
        const newState: GambleState = {
            spinsRemaining: 3,
            lastSpinDate: dateString
        };
        setSpinsLeft(3);
        localStorage.setItem('vranov_gamble_state', JSON.stringify(newState));
    };

    const updateSpins = (newSpins: number) => {
        setSpinsLeft(newSpins);
        const newState: GambleState = {
            spinsRemaining: newSpins,
            lastSpinDate: new Date().toDateString()
        };
        localStorage.setItem('vranov_gamble_state', JSON.stringify(newState));
    };

    const spin = () => {
        if (spinsLeft <= 0 || isSpinning) return;

        setIsSpinning(true);
        setMessage('SPINNING...');
        setWinType('none');

        // consume spin
        updateSpins(spinsLeft - 1);

        // Determine outcome immediately
        const isWin = Math.random() < WIN_CHANCE;

        let finalReels: string[];
        if (isWin) {
            // Force winning combination
            finalReels = ['7️⃣', '7️⃣', '7️⃣']; // Or snake, or CD
        } else {
            // Generate random losing combination
            // Ensure it's not a winning one if we are very unlucky to roll it randomly
            do {
                finalReels = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];
            } while (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]);
        }

        // Animation sequence
        // We will shuffle displayed symbols rapidly
        const spinDuration = 2000; // 2 seconds
        const intervalTime = 100;
        let elapsed = 0;

        const interval = setInterval(() => {
            setReels([
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            ]);
            elapsed += intervalTime;

            if (elapsed >= spinDuration) {
                clearInterval(interval);
                setIsSpinning(false);
                setReels(finalReels);

                if (isWin) {
                    setMessage(`WINNER! CODE: ${DISCOUNT_CODE}`);
                    setWinType('win');
                } else {
                    const loseMessages = ["BETTER LUCK NEXT TIME", "ALMOST THERE...", "TRY AGAIN TOMORROW", "NO LUCK TODAY"];
                    setMessage(loseMessages[Math.floor(Math.random() * loseMessages.length)]);
                    setWinType('lose');
                }
            }
        }, intervalTime);
    };

    return (
        <div className="gamble-window">
            <div className="gamble-container">
                <div className="slot-machine">
                    <div className="casino-lights">
                        <div className={`light ${isSpinning ? 'active' : ''}`} />
                        <div className={`light ${!isSpinning ? 'active' : ''}`} />
                        <div className={`light ${isSpinning ? 'active' : ''}`} />
                        <div className="slot-title">LUCKY SLOT</div>
                        <div className={`light ${isSpinning ? 'active' : ''}`} />
                        <div className={`light ${!isSpinning ? 'active' : ''}`} />
                        <div className={`light ${isSpinning ? 'active' : ''}`} />
                    </div>

                    <div className="slot-display">
                        <div className="payline" />
                        {reels.map((symbol, i) => (
                            <div key={i} className={`slot-reel ${isSpinning ? 'spinning' : ''}`}>
                                <div className="reel-content">
                                    {isSpinning ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] : symbol}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`slot-message ${winType === 'win' ? 'msg-win' : winType === 'lose' ? 'msg-lose' : ''}`}>
                        {message}
                    </div>

                    <div className="slot-controls">
                        <button
                            className="spin-button"
                            onClick={spin}
                            disabled={isSpinning || spinsLeft <= 0}
                        >
                            {isSpinning ? '...' : 'SPIN'}
                        </button>

                        <div className="spin-info">
                            <div className="spins-counter">SPINS LEFT TODAY: {spinsLeft}/3</div>
                            <div style={{ fontSize: '10px', marginTop: '5px' }}>
                                Refreshes daily. Win a discount for lexxbrush.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
