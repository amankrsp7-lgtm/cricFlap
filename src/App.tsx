import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import Overlay from './components/Overlay';
import { GameState } from './types';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.START);
    const [score, setScore] = useState(0);
    const [coinsCollected, setCoinsCollected] = useState(0);
    const [gameKey, setGameKey] = useState(0); // Key to force component remount

    const handleGameOver = () => {
        setGameState(GameState.GAME_OVER);
    };

    const handleStart = () => {
        setGameState(GameState.PLAYING);
        setScore(0);
        setCoinsCollected(0);
        setGameKey(prev => prev + 1); // Increment key to reset GameEngine completely
    };

    return (
        <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center overflow-hidden font-sans">
            <div className="w-full max-w-lg h-full max-h-[900px] relative bg-blue-300 shadow-2xl overflow-hidden md:rounded-xl">
                <GameEngine 
                    key={gameKey}
                    gameState={gameState}
                    setGameState={setGameState}
                    score={score}
                    setScore={setScore}
                    coinsCollected={coinsCollected}
                    setCoinsCollected={setCoinsCollected}
                    onGameOver={handleGameOver}
                />
                
                <Overlay 
                    gameState={gameState}
                    score={score}
                    coinsCollected={coinsCollected}
                    onStart={handleStart}
                />
            </div>
        </div>
    );
};

export default App;