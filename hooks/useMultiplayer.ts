
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerColor, NetStatus, MultiplayerMessage } from '../types';
import { createInitialState } from '../logic/goEngine';

const PEER_PREFIX = 'zengo_v4_'; // New version prefix to avoid old session conflicts

export function useMultiplayer() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [playerColor, setPlayerColor] = useState<PlayerColor>('black');
  const [netStatus, setNetStatus] = useState<NetStatus>('disconnected');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  const cleanup = () => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setNetStatus('disconnected');
    setRoomId(null);
    setError(null);
  };

  const getPeerConfig = () => ({
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    },
  });

  const hostGame = useCallback(() => {
    cleanup();
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const peer = new (window as any).Peer(PEER_PREFIX + code, getPeerConfig());
    
    peerRef.current = peer;
    setNetStatus('waiting');
    setRoomId(code);
    setPlayerColor('black');

    peer.on('open', (id: string) => {
      console.log('Room opened with ID:', id);
    });
    
    peer.on('connection', (conn: any) => {
      // If we already have a connection, ignore new ones
      if (connRef.current) {
        conn.close();
        return;
      }

      connRef.current = conn;
      setNetStatus('connected');
      
      conn.on('data', (data: MultiplayerMessage) => {
        if (data.type === 'MOVE' || data.type === 'SYNC') {
          setGameState(data.state);
        }
        if (data.type === 'RESET') {
          setGameState(createInitialState());
        }
      });

      conn.on('open', () => {
        conn.send({ type: 'SYNC', state: gameState });
      });

      conn.on('close', () => {
        setNetStatus('waiting');
        connRef.current = null;
      });
    });

    peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        setError('Room ID already exists. Try again.');
      } else {
        setError(`Connection error: ${err.type}`);
      }
      cleanup();
    });
  }, [gameState]);

  const joinGame = useCallback((code: string) => {
    if (!code) return;
    cleanup();
    const peer = new (window as any).Peer(undefined, getPeerConfig());
    peerRef.current = peer;
    setNetStatus('connecting');

    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code.toUpperCase(), {
        reliable: true
      });
      connRef.current = conn;
      setPlayerColor('white');

      conn.on('open', () => {
        setNetStatus('connected');
        setRoomId(code.toUpperCase());
        setError(null);
      });

      conn.on('data', (data: MultiplayerMessage) => {
        if (data.type === 'MOVE' || data.type === 'SYNC') {
          setGameState(data.state);
        }
        if (data.type === 'RESET') {
          setGameState(createInitialState());
        }
      });

      conn.on('close', () => {
        setError('Opponent disconnected.');
        cleanup();
      });
    });

    peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      setError(`Could not join room. Error: ${err.type}`);
      setNetStatus('disconnected');
    });
  }, []);

  const sendMove = useCallback((newState: GameState) => {
    setGameState(newState);
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'MOVE', state: newState });
    }
  }, []);

  const resetGame = useCallback(() => {
    const fresh = createInitialState();
    setGameState(fresh);
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'RESET', state: fresh });
    }
  }, []);

  return { 
    gameState, 
    playerColor, 
    netStatus, 
    roomId, 
    error,
    hostGame, 
    joinGame, 
    sendMove, 
    resetGame, 
    setGameState 
  };
}
