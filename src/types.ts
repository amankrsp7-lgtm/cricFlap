export interface Obstacle {
    id: number;
    x: number;
    topHeight: number;
    passed: boolean;
}

export interface Coin {
    id: number;
    x: number;
    y: number;
    collected: boolean;
}

export enum GameState {
    START = 'START',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER'
}
