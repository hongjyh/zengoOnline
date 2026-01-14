
import { GoogleGenAI } from "@google/genai";
import { GameState } from "../types";
// Fix: Import BOARD_SIZE from the logic engine where it is defined, instead of types.ts
import { BOARD_SIZE } from "../logic/goEngine";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getStrategicAdvice(state: GameState): Promise<string> {
  const boardStr = state.board.map(row => 
    row.map(cell => cell === 'black' ? 'B' : cell === 'white' ? 'W' : '.').join(' ')
  ).join('\n');

  const prompt = `
    You are a professional 9-dan Go player.
    Current board state (${BOARD_SIZE}x${BOARD_SIZE}):
    ${boardStr}

    Current turn: ${state.currentTurn}
    Black captures: ${state.captures.black}
    White captures: ${state.captures.white}

    Briefly analyze the board and suggest a strategy for the ${state.currentTurn} player in 2-3 sentences.
  `;

  try {
    // Upgrade to gemini-3-pro-preview for better reasoning on complex tasks like Go board analysis.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "I'm thinking... Try focusing on territory near the edges.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The master is resting. Observe the board carefully!";
  }
}
