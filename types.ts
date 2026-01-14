
export type PlayerColor = 'black' | 'white';
export type CellContent = PlayerColor | null;

export interface GameState {
  board: CellContent[][];
  currentTurn: PlayerColor;
  captures: {
    black: number;
    white: number;
  };
  history: string[];
  gameOver: boolean;
  winner: PlayerColor | 'draw' | null;
  lastMove: { r: number; c: number } | null;
}

export type NetStatus = 'disconnected' | 'connecting' | 'waiting' | 'connected';

export interface MultiplayerMessage {
  type: 'MOVE' | 'RESET' | 'SYNC';
  state: GameState;
}
