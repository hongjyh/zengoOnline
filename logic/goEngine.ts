
import { PlayerColor, CellContent, GameState } from '../types';

export const BOARD_SIZE = 9;

export function createInitialState(): GameState {
  return {
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentTurn: 'black',
    captures: { black: 0, white: 0 },
    history: [],
    gameOver: false,
    winner: null,
    lastMove: null,
  };
}

export function getGroup(
  r: number, 
  c: number, 
  board: CellContent[][], 
  visited: Set<string> = new Set()
): { group: [number, number][]; liberties: Set<string> } {
  const color = board[r][c];
  const key = `${r},${c}`;
  if (!color || visited.has(key)) return { group: [], liberties: new Set() };

  visited.add(key);
  const group: [number, number][] = [[r, c]];
  const liberties = new Set<string>();

  const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of neighbors) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      if (board[nr][nc] === null) {
        liberties.add(`${nr},${nc}`);
      } else if (board[nr][nc] === color) {
        const result = getGroup(nr, nc, board, visited);
        group.push(...result.group);
        result.liberties.forEach(l => liberties.add(l));
      }
    }
  }

  return { group, liberties };
}

export function validateMove(r: number, c: number, state: GameState): { isValid: boolean; error?: string; newState?: GameState } {
  if (state.gameOver) return { isValid: false, error: 'Game is over' };
  if (state.board[r][c] !== null) return { isValid: false, error: 'Cell occupied' };

  const nextBoard = state.board.map(row => [...row]);
  const color = state.currentTurn;
  const opponent = color === 'black' ? 'white' : 'black';
  nextBoard[r][c] = color;

  // 1. Capture opponent stones
  let totalCaptured = 0;
  const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of neighbors) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      if (nextBoard[nr][nc] === opponent) {
        const { group, liberties } = getGroup(nr, nc, nextBoard);
        if (liberties.size === 0) {
          totalCaptured += group.length;
          group.forEach(([gr, gc]) => { nextBoard[gr][gc] = null; });
        }
      }
    }
  }

  // 2. Check suicide rule
  const { liberties: ownLiberties } = getGroup(r, c, nextBoard);
  if (ownLiberties.size === 0) {
    return { isValid: false, error: 'Suicide move prohibited' };
  }

  // 3. Check Ko rule (Position cannot repeat immediately)
  const boardHash = JSON.stringify(nextBoard);
  if (state.history.length > 0 && state.history[state.history.length - 1] === boardHash) {
    return { isValid: false, error: 'Ko rule violation' };
  }

  const newState: GameState = {
    ...state,
    board: nextBoard,
    currentTurn: opponent,
    captures: {
      ...state.captures,
      [color]: state.captures[color] + totalCaptured
    },
    history: [...state.history.slice(-10), boardHash], // Keep last 10 for performance
    lastMove: { r, c },
  };

  return { isValid: true, newState };
}
