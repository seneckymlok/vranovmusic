import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getBrowserFingerprint } from '../utils/fingerprint';
import './GambleWindow.css';

// Symbols for the slot machine
const SYMBOLS = ['💿', '🐍', '💀', '🎤', '👁️', '7️⃣'];
const DISCOUNT_CODE = 'VRANOV_STYLE_25';
const WIN_CHANCE = 0.001; // 0.1% chance - Extremely small as requested

interface GambleState {
    spinsRemaining: number;
    lastSpinDate: string;
}

export const GambleWindow: React.FC = () => {
    const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
    const [message, setMessage] = useState<string>('PRESS SPIN TO PLAY');
    const [spinsLeft, setSpinsLeft] = useState<number>(3); // Default display
    const [winType, setWinType] = useState<'none' | 'win' | 'lose'>('none');
    const [visitorId, setVisitorId] = useState<string>('');

    // Initialize: Get ID and Check Spins
    useEffect(() => {
        const init = async () => {
            // 1. Identify User
            const fp = await getBrowserFingerprint();
            setVisitorId(fp);

            // 2. Check Spins (Server or Local)
            if (isSupabaseConfigured && supabase) {
                checkServerSpins(fp);
            } else {
                checkLocalSpins();
            }
        };
        init();
    }, []);

    // Check spins from Supabase
    const checkServerSpins = async (fp: string) => {
        if (!supabase) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const { count, error } = await supabase
                .from('gamble_spins')
                .select('*', { count: 'exact', head: true })
                .eq('visitor_id', fp)
                .gte('created_at', todayISO);

            if (error) throw error;

            const usedSpins = count || 0;
            const remaining = Math.max(0, 3 - usedSpins);
            setSpinsLeft(remaining);

            if (remaining === 0) {
                setMessage('NO SPINS LEFT TODAY');
            }
        } catch (err) {
            console.error('Error fetching spins:', err);
            // Fallback to local if server fails
            checkLocalSpins();
        }
    };

    // Fallback: Local Storage Check
    const checkLocalSpins = () => {
        const today = new Date().toDateString();
        const savedState = localStorage.getItem('vranov_gamble_state');

        if (savedState) {
            const parsed: GambleState = JSON.parse(savedState);
            if (parsed.lastSpinDate === today) {
                setSpinsLeft(parsed.spinsRemaining);
                if (parsed.spinsRemaining === 0) setMessage('NO SPINS LEFT TODAY');
            } else {
                resetLocalSpins(today);
            }
        } else {
            resetLocalSpins(today);
        }
    };

    const resetLocalSpins = (dateString: string) => {
        const newState: GambleState = {
            spinsRemaining: 3,
            lastSpinDate: dateString
        };
        setSpinsLeft(3);
        localStorage.setItem('vranov_gamble_state', JSON.stringify(newState));
    };

    const updateLocalSpins = (newSpins: number) => {
        const newState: GambleState = {
            spinsRemaining: newSpins,
            lastSpinDate: new Date().toDateString()
        };
        localStorage.setItem('vranov_gamble_state', JSON.stringify(newState));
    };

    const spin = async () => {
        if (spinsLeft <= 0 || isSpinning) return;

        setIsSpinning(true);
        setSpinningReels([true, true, true]);
        setMessage('SPINNING...');
        setWinType('none');

        // Optimistic Update
        const newSpins = spinsLeft - 1;
        setSpinsLeft(newSpins);

        // Record Spin (Fire and Forget/Await based on strictness)
        if (isSupabaseConfigured && supabase && visitorId) {
            await supabase.from('gamble_spins').insert({
                visitor_id: visitorId
            });
        }
        // Always update mirror local for offline safety/UX
        updateLocalSpins(newSpins);

        // Determine outcome immediately
        const isWin = Math.random() < WIN_CHANCE;

        let finalReels: string[];
        if (isWin) {
            // Force winning combination
            finalReels = ['7️⃣', '7️⃣', '7️⃣'];
        } else {
            // Generate random losing combination
            do {
                finalReels = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];
            } while (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]);
        }

        // Animation sequence with sequential stopping
        const startTime = Date.now();
        const stopTimes = [1500, 2200, 3000]; // ms
        const intervalTime = 80;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            // Check which reels should stop
            const newSpinningReels = [
                elapsed < stopTimes[0],
                elapsed < stopTimes[1],
                elapsed < stopTimes[2]
            ];
            setSpinningReels(newSpinningReels);

            setReels(prevReels => {
                const updatedReels = [...prevReels];

                // For each reel
                [0, 1, 2].forEach(i => {
                    if (elapsed < stopTimes[i]) {
                        // Still spinning: random symbol
                        updatedReels[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                    } else {
                        // Stopped: Lock to final
                        updatedReels[i] = finalReels[i];
                    }
                });

                return updatedReels;
            });

            if (elapsed >= stopTimes[2] + 100) {
                clearInterval(interval);
                setIsSpinning(false);
                setSpinningReels([false, false, false]);
                setReels(finalReels); // Ensure final state is exact

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
                            <div key={i} className={`slot-reel ${spinningReels[i] ? 'spinning' : ''}`}>
                                <div className="reel-content">
                                    {spinningReels[i] ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] : symbol}
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

