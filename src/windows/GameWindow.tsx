import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GameWindow.css';

interface Position {
    x: number;
    y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type FoodType = 'note' | 'cd' | 'cassette' | 'instrument';

interface GameState {
    snake: Position[];
    direction: Direction;
    nextDirection: Direction; // Buffer for next move
    food: Position;
    foodType: FoodType;
    score: number;
    highScore: number;
    level: number;
    isPaused: boolean;
    isGameOver: boolean;
    speed: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200;
const FOOD_VALUES: Record<FoodType, number> = {
    note: 1,
    cd: 2,
    cassette: 3,
    instrument: 5,
};

const FOOD_ICONS: Record<FoodType, string> = {
    note: '🎵',
    cd: '💿',
    cassette: '📼',
    instrument: '🎸',
};

const getRandomPosition = (snake: Position[]): Position => {
    let position: Position;
    let isValid = false;

    while (!isValid) {
        position = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };

        isValid = !snake.some(segment =>
            segment.x === position.x && segment.y === position.y
        );
    }

    return position!;
};

const getRandomFoodType = (): FoodType => {
    const rand = Math.random();
    if (rand < 0.05) return 'instrument'; // 5% rare
    if (rand < 0.20) return 'cassette';   // 15%
    if (rand < 0.45) return 'cd';         // 25%
    return 'note';                        // 55%
};

const calculateSpeed = (score: number): number => {
    if (score >= 100) return 50;  // Level 5
    if (score >= 50) return 75;   // Level 4
    if (score >= 25) return 100;  // Level 3
    if (score >= 10) return 150;  // Level 2
    return INITIAL_SPEED;          // Level 1
};

const calculateLevel = (score: number): number => {
    if (score >= 100) return 5;
    if (score >= 50) return 4;
    if (score >= 25) return 3;
    if (score >= 10) return 2;
    return 1;
};

export const GameWindow: React.FC = () => {
    const initialSnake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ];

    const [gameState, setGameState] = useState<GameState>(() => ({
        snake: initialSnake,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: getRandomPosition(initialSnake),
        foodType: getRandomFoodType(),
        score: 0,
        highScore: parseInt(localStorage.getItem('vranov_vinyl_snake_high_score') || '0'),
        level: 1,
        isPaused: false,
        isGameOver: false,
        speed: INITIAL_SPEED,
    }));

    const gameLoopRef = useRef<number>(0);

    const resetGame = useCallback(() => {
        const initialSnake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
        ];

        setGameState(prev => ({
            snake: initialSnake,
            direction: 'RIGHT',
            nextDirection: 'RIGHT',
            food: getRandomPosition(initialSnake),
            foodType: getRandomFoodType(),
            score: 0,
            highScore: prev.highScore,
            level: 1,
            isPaused: false,
            isGameOver: false,
            speed: INITIAL_SPEED,
        }));
    }, []);

    const moveSnake = useCallback(() => {
        setGameState(prev => {
            if (prev.isPaused || prev.isGameOver) return prev;

            const newSnake = [...prev.snake];
            const head = { ...newSnake[0] };
            const direction = prev.nextDirection;

            // Move head
            switch (direction) {
                case 'UP':
                    head.y -= 1;
                    break;
                case 'DOWN':
                    head.y += 1;
                    break;
                case 'LEFT':
                    head.x -= 1;
                    break;
                case 'RIGHT':
                    head.x += 1;
                    break;
            }

            // Check wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                return { ...prev, isGameOver: true };
            }

            // Check self collision
            if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
                return { ...prev, isGameOver: true };
            }

            newSnake.unshift(head);

            // Check food collision
            if (head.x === prev.food.x && head.y === prev.food.y) {
                const points = FOOD_VALUES[prev.foodType];
                const newScore = prev.score + points;
                const newSpeed = calculateSpeed(newScore);
                const newLevel = calculateLevel(newScore);
                const newHighScore = Math.max(newScore, prev.highScore);

                // Save high score
                if (newScore > prev.highScore) {
                    localStorage.setItem('vranov_vinyl_snake_high_score', newScore.toString());
                }

                return {
                    ...prev,
                    snake: newSnake,
                    direction,
                    food: getRandomPosition(newSnake),
                    foodType: getRandomFoodType(),
                    score: newScore,
                    highScore: newHighScore,
                    level: newLevel,
                    speed: newSpeed,
                };
            } else {
                newSnake.pop();
                return {
                    ...prev,
                    snake: newSnake,
                    direction,
                };
            }
        });
    }, []);

    // Game loop
    useEffect(() => {
        if (gameState.isGameOver || gameState.isPaused) {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
            return;
        }

        let lastTime = Date.now();

        const gameLoop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= gameState.speed) {
                moveSnake();
                lastTime = currentTime;
            }

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameState.speed, gameState.isGameOver, gameState.isPaused, moveSnake]);

    const handleDirection = useCallback((newDir: Direction) => {
        setGameState(prev => {
            if (prev.isPaused || prev.isGameOver) return prev;

            const currentDir = prev.direction;

            // Prevent reversing
            if (newDir === 'UP' && currentDir === 'DOWN') return prev;
            if (newDir === 'DOWN' && currentDir === 'UP') return prev;
            if (newDir === 'LEFT' && currentDir === 'RIGHT') return prev;
            if (newDir === 'RIGHT' && currentDir === 'LEFT') return prev;

            return { ...prev, nextDirection: newDir };
        });
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState.isGameOver) {
                if (e.key === 'r' || e.key === 'R') {
                    resetGame();
                }
                return;
            }

            if (e.key === ' ') {
                e.preventDefault();
                setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    handleDirection('UP');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    handleDirection('DOWN');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handleDirection('LEFT');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleDirection('RIGHT');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.isGameOver, resetGame, handleDirection]);

    return (
        <div className="game-window">
            {/* Score Bar */}
            <div className="game-score-bar">
                <span className="score-item">Score: {gameState.score}</span>
                <span className="score-item">High: {gameState.highScore}</span>
                <span className="score-item">Level: {gameState.level}</span>
            </div>

            {/* Game Canvas */}
            <div className="game-canvas-container">
                <canvas
                    className="game-canvas"
                    width={GRID_SIZE * CELL_SIZE}
                    height={GRID_SIZE * CELL_SIZE}
                    ref={(canvas) => {
                        if (!canvas) return;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        // Clear canvas
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw grid
                        ctx.strokeStyle = '#111';
                        ctx.lineWidth = 1;
                        for (let i = 0; i <= GRID_SIZE; i++) {
                            ctx.beginPath();
                            ctx.moveTo(i * CELL_SIZE, 0);
                            ctx.lineTo(i * CELL_SIZE, canvas.height);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(0, i * CELL_SIZE);
                            ctx.lineTo(canvas.width, i * CELL_SIZE);
                            ctx.stroke();
                        }

                        // Draw snake
                        gameState.snake.forEach((segment, index) => {
                            if (index === 0) {
                                // Head - vinyl record
                                ctx.fillStyle = '#ff0000';
                                ctx.beginPath();
                                ctx.arc(
                                    segment.x * CELL_SIZE + CELL_SIZE / 2,
                                    segment.y * CELL_SIZE + CELL_SIZE / 2,
                                    CELL_SIZE / 2 - 2,
                                    0,
                                    Math.PI * 2
                                );
                                ctx.fill();
                                // Center hole
                                ctx.fillStyle = '#000';
                                ctx.beginPath();
                                ctx.arc(
                                    segment.x * CELL_SIZE + CELL_SIZE / 2,
                                    segment.y * CELL_SIZE + CELL_SIZE / 2,
                                    3,
                                    0,
                                    Math.PI * 2
                                );
                                ctx.fill();
                            } else {
                                // Body - connected records
                                ctx.fillStyle = '#cc0000';
                                ctx.fillRect(
                                    segment.x * CELL_SIZE + 2,
                                    segment.y * CELL_SIZE + 2,
                                    CELL_SIZE - 4,
                                    CELL_SIZE - 4
                                );
                            }
                        });

                        // Draw food
                        ctx.font = `${CELL_SIZE - 4}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            FOOD_ICONS[gameState.foodType],
                            gameState.food.x * CELL_SIZE + CELL_SIZE / 2,
                            gameState.food.y * CELL_SIZE + CELL_SIZE / 2
                        );
                    }}
                />

                {/* Overlays */}
                {gameState.isPaused && !gameState.isGameOver && (
                    <div className="game-overlay">
                        <div className="game-overlay-content">
                            <h2 className="pixel-text">⏸️ PAUSED</h2>
                            <p>Press SPACE to resume</p>
                        </div>
                    </div>
                )}

                {gameState.isGameOver && (
                    <div className="game-overlay">
                        <div className="game-overlay-content">
                            <h2 className="pixel-text">💀 GAME OVER!</h2>
                            <p className="game-over-score">Your Score: {gameState.score}</p>
                            <p className="game-over-high">High Score: {gameState.highScore}</p>
                            {gameState.score === gameState.highScore && gameState.score > 0 && (
                                <p className="game-over-new-high">🎉 NEW HIGH SCORE! 🎉</p>
                            )}
                            <button className="btn-98 btn-98-primary" onClick={resetGame}>
                                Press R to Restart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="game-controls-bar">
                <span>← → ↑ ↓ Move</span>
                <span>SPACE Pause</span>
                <span>R Restart</span>
            </div>


            {/* Mobile Controls */}
            <div className="game-mobile-controls">
                <div className="dpad-row">
                    <button className="dpad-btn" onPointerDown={() => handleDirection('UP')}>▲</button>
                </div>
                <div className="dpad-row">
                    <button className="dpad-btn" onPointerDown={() => handleDirection('LEFT')}>◀</button>
                    <button className="dpad-btn" onPointerDown={() => handleDirection('DOWN')}>▼</button>
                    <button className="dpad-btn" onPointerDown={() => handleDirection('RIGHT')}>▶</button>
                </div>
            </div>
        </div >
    );
};
