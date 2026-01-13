import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Obstacle, Coin } from '../types';
import { 
    GRAVITY, JUMP_STRENGTH, OBSTACLE_SPEED, OBSTACLE_WIDTH, 
    OBSTACLE_GAP, OBSTACLE_SPACING, BIRD_SIZE, COIN_SIZE,
    VK_IMG, GG_IMG, MSD_IMG, BG_MUSIC_URL, COIN_SOUND_URL, GAME_OVER_SOUND_URL,
    STADIUM_BG_URL
} from '../constants';

interface GameEngineProps {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    score: number;
    setScore: (score: number | ((prev: number) => number)) => void;
    coinsCollected: number;
    setCoinsCollected: (count: number | ((prev: number) => number)) => void;
    onGameOver: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
    gameState, setGameState, score, setScore, 
    coinsCollected, setCoinsCollected, onGameOver 
}) => {
    const [birdY, setBirdY] = useState(300);
    const [birdVelocity, setBirdVelocity] = useState(0);
    
    // We use Refs for game logic to avoid stale state in the loop
    const obstaclesRef = useRef<Obstacle[]>([]);
    const coinsRef = useRef<Coin[]>([]);
    
    // Ref for scrolling ground animation
    const groundXRef = useRef(0);
    
    // We keep state for rendering
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [groundX, setGroundX] = useState(0); // State to trigger render for ground
    
    const gameLoopRef = useRef<number>(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);

    // Initial Data Generation
    const getInitialObstacles = () => [
        { id: 1, x: 500, topHeight: 200, passed: false },
        { id: 2, x: 500 + OBSTACLE_SPACING, topHeight: 300, passed: false }
    ];

    const getInitialCoins = () => [
        { id: 1, x: 500 + OBSTACLE_WIDTH / 2 - COIN_SIZE / 2, y: 200 + OBSTACLE_GAP / 2 - COIN_SIZE / 2, collected: false }
    ];

    // Initialize Refs and State on Mount
    useEffect(() => {
        const initObs = getInitialObstacles();
        const initCoins = getInitialCoins();
        obstaclesRef.current = initObs;
        coinsRef.current = initCoins;
        setObstacles(initObs);
        setCoins(initCoins);
        groundXRef.current = 0;
        setGroundX(0);
    }, []);

    // Audio Management
    useEffect(() => {
        bgMusicRef.current = new Audio(BG_MUSIC_URL);
        bgMusicRef.current.loop = true;
        bgMusicRef.current.volume = 0.5;

        if (gameState === GameState.PLAYING) {
            bgMusicRef.current.play().catch(e => console.log("Audio autoplay blocked:", e));
        } else if (gameState === GameState.GAME_OVER) {
            // Play Game Over Sound
            const gameOverSound = new Audio(GAME_OVER_SOUND_URL);
            gameOverSound.volume = 0.8;
            gameOverSound.play().catch(e => console.error("Game over audio error:", e));
        }

        return () => {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                bgMusicRef.current.currentTime = 0;
            }
        };
    }, [gameState]);

    const playCoinSound = useCallback(() => {
        const audio = new Audio(COIN_SOUND_URL);
        audio.volume = 0.6;
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Coin sound error:", e));
    }, []);

    // Reset Game
    const resetGame = useCallback(() => {
        setBirdY(300);
        setBirdVelocity(0);
        
        const initObs = getInitialObstacles();
        const initCoins = getInitialCoins();
        
        obstaclesRef.current = initObs;
        coinsRef.current = initCoins;
        groundXRef.current = 0;
        
        setObstacles(initObs);
        setCoins(initCoins);
        setGroundX(0);
        
        setScore(0);
        setCoinsCollected(0);
    }, [setScore, setCoinsCollected]);

    // Jump Handler
    const jump = useCallback(() => {
        if (gameState === GameState.PLAYING) {
            setBirdVelocity(JUMP_STRENGTH);
        } else if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
            setGameState(GameState.PLAYING);
            resetGame();
        }
    }, [gameState, setGameState, resetGame]);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                jump();
            }
        };
        const handleTouchStart = () => {
            jump();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('touchstart', handleTouchStart);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouchStart);
        };
    }, [jump]);

    // Main Game Loop
    useEffect(() => {
        if (gameState !== GameState.PLAYING) {
            cancelAnimationFrame(gameLoopRef.current);
            return;
        }

        let lastTime = performance.now();

        const loop = (time: number) => {
            const deltaTime = time - lastTime;
            lastTime = time;

            // 1. Update Bird Physics (State based)
            setBirdY(prevY => prevY + birdVelocity);
            setBirdVelocity(v => v + GRAVITY);

            // 2. Update Ground Parallax
            // The striped pattern repeats every 100px (50px light, 50px dark)
            // We loop the value between 0 and 100 to prevent integer overflow over long games
            groundXRef.current = (groundXRef.current + OBSTACLE_SPEED) % 100;

            // 3. Update Obstacles & Coins (Ref based for synchronous logic)
            let currentObstacles = obstaclesRef.current;
            let currentCoins = coinsRef.current;

            // Move Obstacles
            currentObstacles = currentObstacles
                .map(obs => ({ ...obs, x: obs.x - OBSTACLE_SPEED }))
                .filter(obs => obs.x + OBSTACLE_WIDTH > -100);

            // Spawn Logic
            const lastObstacle = currentObstacles[currentObstacles.length - 1];
            if (!lastObstacle || lastObstacle.x < window.innerWidth - OBSTACLE_SPACING) {
                const gameHeight = gameAreaRef.current?.clientHeight || 600;
                // Accounting for ground height (48px)
                const groundHeight = 48;
                const minHeight = 50;
                const maxHeight = gameHeight - groundHeight - OBSTACLE_GAP - minHeight;
                const newTopHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
                
                const newObstacle = {
                    id: Date.now() + Math.random(),
                    x: window.innerWidth,
                    topHeight: newTopHeight,
                    passed: false
                };
                currentObstacles.push(newObstacle);

                // Spawn Coin Logic (50% chance)
                if (Math.random() > 0.5) {
                    const coinX = newObstacle.x + (OBSTACLE_WIDTH / 2) - (COIN_SIZE / 2);
                    const coinY = newTopHeight + (OBSTACLE_GAP / 2) - (COIN_SIZE / 2);
                    
                    currentCoins.push({
                        id: Date.now() + Math.random(),
                        x: coinX,
                        y: coinY,
                        collected: false
                    });
                }
            }

            // Move Coins
            currentCoins = currentCoins
                .map(coin => ({ ...coin, x: coin.x - OBSTACLE_SPEED }))
                .filter(coin => coin.x > -50);

            // Update Refs
            obstaclesRef.current = currentObstacles;
            coinsRef.current = currentCoins;

            // Sync with State for Render
            setObstacles(currentObstacles);
            setCoins(currentCoins);
            setGroundX(groundXRef.current); // Trigger render for ground movement

            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(gameLoopRef.current);
    }, [gameState, birdVelocity]);

    // Collision Detection
    useEffect(() => {
        if (gameState !== GameState.PLAYING) return;

        const gameHeight = gameAreaRef.current?.clientHeight || 600;
        const groundHeight = 48; // Height of the green bar at bottom

        // Floor/Ceiling
        // Collision happens if bird hits the ground (gameHeight - groundHeight)
        if (birdY < 0 || birdY + BIRD_SIZE > (gameHeight - groundHeight)) {
            onGameOver();
            return;
        }

        // Obstacles
        const birdRect = {
            left: 50 + 10,
            right: 50 + BIRD_SIZE - 10,
            top: birdY + 10,
            bottom: birdY + BIRD_SIZE - 10
        };

        obstacles.forEach(obs => {
            const obsLeft = obs.x;
            const obsRight = obs.x + OBSTACLE_WIDTH;

            const topPipeRect = {
                left: obsLeft, right: obsRight, top: 0, bottom: obs.topHeight
            };

            const bottomPipeRect = {
                left: obsLeft, 
                right: obsRight, 
                top: obs.topHeight + OBSTACLE_GAP, 
                // Bottom pipe extends to the ground
                bottom: gameHeight - groundHeight 
            };

            if (
                (birdRect.right > topPipeRect.left && birdRect.left < topPipeRect.right && birdRect.top < topPipeRect.bottom) ||
                (birdRect.right > bottomPipeRect.left && birdRect.left < bottomPipeRect.right && birdRect.bottom > bottomPipeRect.top)
            ) {
                onGameOver();
            }

            // Score update
            if (!obs.passed && birdRect.left > obsRight) {
                setScore(s => s + 1);
                const updatePassed = (list: Obstacle[]) => list.map(p => p.id === obs.id ? { ...p, passed: true } : p);
                setObstacles(updatePassed);
                obstaclesRef.current = updatePassed(obstaclesRef.current);
            }
        });

        // Coins
        coins.forEach(coin => {
            if (coin.collected) return;
            
            const coinCenterX = coin.x + COIN_SIZE / 2;
            const coinCenterY = coin.y + COIN_SIZE / 2;
            const birdCenterX = 50 + BIRD_SIZE / 2;
            const birdCenterY = birdY + BIRD_SIZE / 2;
            
            const dist = Math.sqrt(Math.pow(coinCenterX - birdCenterX, 2) + Math.pow(coinCenterY - birdCenterY, 2));

            if (dist < (BIRD_SIZE / 2 + COIN_SIZE / 2)) {
                setCoinsCollected(c => c + 1);
                playCoinSound();
                
                const updateCollected = (list: Coin[]) => list.map(c => c.id === coin.id ? { ...c, collected: true } : c);
                setCoins(updateCollected);
                coinsRef.current = updateCollected(coinsRef.current);
            }
        });

    }, [birdY, obstacles, coins, gameState, onGameOver, setScore, setCoinsCollected, playCoinSound]);


    return (
        <div 
            ref={gameAreaRef} 
            className="relative w-full h-full overflow-hidden cursor-pointer"
            onClick={jump}
        >
            {/* --- BACKGROUND LAYERS --- */}
            
            {/* 1. Base Dark Blue (Loading/Fallback) */}
            <div className="absolute inset-0 bg-slate-900 z-0"></div>

            {/* 2. Stadium Image */}
            <div 
                className="absolute inset-0 z-0 opacity-60 bg-cover bg-center transition-opacity"
                style={{ 
                    backgroundImage: `url(${STADIUM_BG_URL})`,
                }}
            ></div>

            {/* 3. Blue/Day Gradient Overlay (Atmosphere) */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-400/40 via-blue-500/10 to-transparent z-0"></div>

            {/* Clouds (Decor) */}
            <div className="absolute top-10 left-10 text-white opacity-80 text-6xl drop-shadow-lg animate-[pulse_4s_ease-in-out_infinite]">☁️</div>
            <div className="absolute top-24 left-1/2 text-white opacity-60 text-5xl drop-shadow-md animate-[pulse_5s_ease-in-out_infinite]">☁️</div>
            <div className="absolute top-5 right-20 text-white opacity-70 text-6xl drop-shadow-lg animate-[pulse_6s_ease-in-out_infinite]">☁️</div>


            {/* --- GAME LAYERS --- */}

            {/* Bird (Virat) */}
            <div 
                className="absolute z-30 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)] rounded-full"
                style={{ 
                    top: birdY, 
                    left: 50, 
                    width: BIRD_SIZE, 
                    height: BIRD_SIZE,
                    transform: `rotate(${birdVelocity * 3}deg)`
                }}
            >
                <img 
                    src={VK_IMG} 
                    alt="Virat" 
                    className="w-full h-full rounded-full border-2 border-white object-cover" 
                />
            </div>

            {/* Obstacles (Gambhir) */}
            {obstacles.map(obs => (
                <React.Fragment key={obs.id}>
                    {/* Top Pipe */}
                    <div 
                        className="absolute bg-purple-900 border-x-4 border-b-4 border-black z-10 flex flex-col items-center justify-end overflow-hidden shadow-2xl"
                        style={{
                            left: obs.x,
                            top: 0,
                            width: OBSTACLE_WIDTH,
                            height: obs.topHeight,
                            borderBottomLeftRadius: 10,
                            borderBottomRightRadius: 10
                        }}
                    >
                        <div 
                            className="w-full h-full opacity-80"
                            style={{
                                backgroundImage: `url(${GG_IMG})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center bottom'
                            }}
                        />
                    </div>

                    {/* Bottom Pipe */}
                    <div 
                        className="absolute bg-purple-900 border-x-4 border-t-4 border-black z-10 flex flex-col items-center justify-start overflow-hidden shadow-2xl"
                        style={{
                            left: obs.x,
                            top: obs.topHeight + OBSTACLE_GAP,
                            width: OBSTACLE_WIDTH,
                            bottom: 48, // Stop at the ground
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10
                        }}
                    >
                         <div 
                            className="w-full h-full opacity-80"
                            style={{
                                backgroundImage: `url(${GG_IMG})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center top'
                            }}
                        />
                    </div>
                </React.Fragment>
            ))}

            {/* Coins (Dhoni) */}
            {coins.map(coin => !coin.collected && (
                <div
                    key={coin.id}
                    className="absolute z-20 animate-pulse"
                    style={{
                        left: coin.x,
                        top: coin.y,
                        width: COIN_SIZE,
                        height: COIN_SIZE
                    }}
                >
                    <img 
                        src={MSD_IMG} 
                        alt="Dhoni" 
                        className="w-full h-full rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)] object-cover" 
                    />
                </div>
            ))}

            {/* Ground (Striped Turf) */}
            <div 
                className="absolute bottom-0 w-full h-12 z-40 border-t-4 border-green-900"
                style={{
                    // Striped lawn pattern: 50px light, 50px dark. Total 100px.
                    backgroundImage: 'repeating-linear-gradient(90deg, #4ade80 0px, #4ade80 50px, #22c55e 50px, #22c55e 100px)',
                    backgroundPositionX: -groundX // Moves left to create forward motion illusion
                }}
            ></div>
        </div>
    );
};

export default GameEngine;