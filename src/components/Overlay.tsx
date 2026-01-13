import React from 'react';
import { GameState } from '../types';
import { VK_IMG, GG_IMG, MSD_IMG } from '../constants';

interface OverlayProps {
    gameState: GameState;
    score: number;
    coinsCollected: number;
    onStart: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
    gameState, score, coinsCollected, onStart 
}) => {
    if (gameState === GameState.PLAYING) {
        return (
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-50">
                <div className="flex flex-col gap-2">
                    <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg border-2 border-blue-500 flex items-center gap-2">
                        <span className="font-bold text-blue-900 pixel-font text-xl">RUNS: {score}</span>
                    </div>
                    <div className="bg-yellow-100/90 px-4 py-2 rounded-full shadow-lg border-2 border-yellow-500 flex items-center gap-2">
                         <img src={MSD_IMG} className="w-6 h-6 rounded-full"/>
                        <span className="font-bold text-yellow-900 pixel-font text-xl">x {coinsCollected}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-4 border-blue-600 animate-fade-in">
                {gameState === GameState.START ? (
                    <>
                        <h1 className="text-4xl font-black text-blue-800 mb-2 tracking-tighter">CRICFLAP</h1>
                        <h2 className="text-xl font-bold text-gray-600 mb-6">KOHLI vs GAMBHIR</h2>
                        
                        <div className="flex justify-center gap-6 mb-8">
                            <div className="flex flex-col items-center">
                                <img src={VK_IMG} className="w-16 h-16 rounded-full border-4 border-red-500 mb-2 shadow-lg"/>
                                <span className="text-xs font-bold text-gray-500">YOU (VK)</span>
                            </div>
                            <div className="flex items-center text-2xl font-bold text-gray-400">VS</div>
                            <div className="flex flex-col items-center">
                                <img src={GG_IMG} className="w-16 h-16 rounded-full border-4 border-purple-800 mb-2 shadow-lg"/>
                                <span className="text-xs font-bold text-gray-500">OBSTACLE (GG)</span>
                            </div>
                        </div>

                        <p className="text-gray-500 mb-8 text-sm">
                            Tap, Click or Spacebar to Jump.<br/>
                            Collect <span className="text-yellow-600 font-bold">MSD Coins</span> for bonus glory!
                        </p>

                        <button 
                            onClick={onStart}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg border-b-4 border-blue-800"
                        >
                            START MATCH
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-black text-red-600 mb-2">WICKET!</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6 w-full">
                            <div className="bg-gray-100 p-4 rounded-xl flex flex-col items-center">
                                <span className="text-gray-500 text-xs font-bold uppercase">Runs Scored</span>
                                <span className="text-3xl font-black text-blue-900">{score}</span>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-xl flex flex-col items-center border border-yellow-200">
                                <span className="text-yellow-700 text-xs font-bold uppercase">Thala</span>
                                <span className="text-3xl font-black text-yellow-600 flex items-center gap-1">
                                    <img src={MSD_IMG} className="w-6 h-6 rounded-full" /> {coinsCollected}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={onStart}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg border-b-4 border-green-800"
                        >
                            PLAY AGAIN
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Overlay;