
import React, { useState } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer';
import { validateMove } from './logic/goEngine';
import Stone from './components/Stone';
import { getStrategicAdvice } from './services/gemini';
import { Shield, Info, RefreshCw, Cpu, Users, ChevronRight, Wifi, WifiOff, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [inputRoomId, setInputRoomId] = useState('');
  const [advice, setAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [copied, setCopied] = useState(false);

  const { 
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
  } = useMultiplayer();

  const handleCellClick = (r: number, c: number) => {
    // In multi mode, only allow moves if it's your turn
    if (mode === 'multi') {
      if (netStatus !== 'connected') return;
      if (gameState.currentTurn !== playerColor) return;
    }
    
    const validation = validateMove(r, c, gameState);
    if (validation.isValid && validation.newState) {
      if (mode === 'multi' && netStatus === 'connected') {
        sendMove(validation.newState);
      } else {
        setGameState(validation.newState);
      }
      setAdvice('');
    }
  };

  const askMaster = async () => {
    setIsAiLoading(true);
    const result = await getStrategicAdvice(gameState);
    setAdvice(result);
    setIsAiLoading(false);
  };

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200 p-4 md:p-8 flex flex-col items-center custom-scrollbar">
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600 flex items-center gap-3">
            <Shield className="w-10 h-10 text-orange-500" /> ZenGo Online
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-2.5 h-2.5 rounded-full ${
               netStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 
               netStatus === 'waiting' ? 'bg-yellow-500 animate-pulse' : 
               netStatus === 'connecting' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
             }`} />
             <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">
               {netStatus === 'connected' ? 'Secure P2P Online' : 
                netStatus === 'waiting' ? 'Waiting for friend...' : 
                netStatus === 'connecting' ? 'Bridging Networks...' : 'Local Engine Active'}
             </span>
          </div>
        </div>
        
        <div className="flex bg-neutral-800/50 p-1.5 rounded-2xl border border-neutral-700/50 backdrop-blur-md shadow-2xl">
          <button 
            onClick={() => { setMode('single'); }}
            className={`px-8 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-bold ${mode === 'single' ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/30'}`}
          >
            <Cpu className="w-4 h-4" /> Offline
          </button>
          <button 
            onClick={() => { setMode('multi'); }}
            className={`px-8 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-bold ${mode === 'multi' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/30'}`}
          >
            <Users className="w-4 h-4" /> Multiplayer
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Controls & Info */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          {mode === 'multi' && (
            <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-700/50 backdrop-blur-sm shadow-xl space-y-5">
              <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-400" /> Lobby Control
              </h2>
              
              {!roomId ? (
                <div className="space-y-4">
                  <button 
                    onClick={hostGame}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    Host New Match
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-700"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1a1a1a] px-2 text-neutral-500">or join existing</span></div>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Room Code (e.g. A7B2)"
                      className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 text-center font-mono text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value)}
                    />
                    <button 
                      onClick={() => joinGame(inputRoomId)}
                      className="w-full py-3 border border-blue-600 text-blue-400 hover:bg-blue-600/10 rounded-xl font-bold transition-all"
                    >
                      Connect to Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-800/30 text-center relative group">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">Your Match Code</span>
                    <span className="text-3xl font-mono font-bold tracking-widest text-white">{roomId}</span>
                    <button 
                      onClick={copyRoomCode}
                      className="absolute top-2 right-2 p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                    </button>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-neutral-900/50 border border-neutral-700/30">
                    <span className="text-xs text-neutral-400">Playing as <b className="text-orange-400">{playerColor.toUpperCase()}</b></span>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-2 text-neutral-500 hover:text-red-400 text-xs font-bold uppercase transition-colors"
                  >
                    Leave Session
                  </button>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl flex items-start gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-700/50 backdrop-blur-sm shadow-xl">
            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400" /> Captures
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-black border border-neutral-700 shadow-md" />
                  <span className="text-sm font-semibold">Black</span>
                </div>
                <span className="text-3xl font-black text-orange-400 font-mono">{gameState.captures.black}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white border border-neutral-200 shadow-md" />
                  <span className="text-sm font-semibold text-neutral-400">White</span>
                </div>
                <span className="text-3xl font-black text-blue-400 font-mono">{gameState.captures.white}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: The Board */}
        <section className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative group">
            {/* Glow effect behind board */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 rounded-[2rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="wood-texture p-4 md:p-6 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-8 border-[#5d4037] relative z-10">
              <div 
                className="grid gap-0" 
                style={{ 
                  gridTemplateColumns: `repeat(9, min(9vw, 55px))`,
                  gridTemplateRows: `repeat(9, min(9vw, 55px))`
                }}
              >
                {gameState.board.map((row, r) => row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`} 
                    onClick={() => handleCellClick(r, c)}
                    className="relative flex items-center justify-center cursor-pointer touch-none"
                  >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className={`absolute top-1/2 left-0 right-0 h-[1.5px] bg-black/40 ${c === 0 ? 'left-1/2' : c === 8 ? 'right-1/2' : ''}`} />
                      <div className={`absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-black/40 ${r === 0 ? 'top-1/2' : r === 8 ? 'bottom-1/2' : ''}`} />
                    </div>
                    
                    {/* Hoshi (Star points) */}
                    {((r === 2 || r === 6) && (c === 2 || c === 6)) || (r === 4 && c === 4) ? (
                      <div className="absolute w-2 h-2 bg-black/60 rounded-full z-0" />
                    ) : null}

                    {/* Stone Layer */}
                    <div className="relative z-10 w-[85%] h-[85%] flex items-center justify-center">
                      {cell ? (
                        <Stone color={cell} isLast={gameState.lastMove?.r === r && gameState.lastMove?.c === c} />
                      ) : (
                        <div className="w-full h-full rounded-full bg-black/5 opacity-0 hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-6 w-full">
            <div className="flex items-center gap-3 bg-neutral-800/60 px-6 py-3 rounded-2xl border border-neutral-700/50 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Next Turn</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${gameState.currentTurn === 'black' ? 'bg-black border border-neutral-600' : 'bg-white border border-neutral-200'}`} />
                <span className={`text-sm font-bold ${gameState.currentTurn === 'black' ? 'text-white' : 'text-blue-400'}`}>
                  {gameState.currentTurn.toUpperCase()}
                </span>
              </div>
            </div>
            
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-2xl border border-neutral-700 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4" /> Reset Match
            </button>
          </div>
        </section>

        {/* Right Sidebar: AI Strategist */}
        <aside className="lg:col-span-3 space-y-6 order-3">
          <div className="bg-neutral-800/40 p-6 rounded-3xl border border-neutral-700/50 backdrop-blur-sm shadow-xl h-full flex flex-col">
            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Gemini Dan-9
            </h2>
            
            <div className="flex-grow bg-neutral-900/60 rounded-2xl p-5 border border-neutral-800 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                <Shield className="w-12 h-12 text-white" />
              </div>
              
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-xs text-neutral-500 animate-pulse font-medium">Scanning board layout...</p>
                </div>
              ) : (
                <div className="text-sm text-neutral-300 leading-relaxed italic animate-in fade-in duration-700">
                  {advice || "Board state is ready for professional analysis. Click the button below to receive strategic guidance from our 9-dan AI."}
                </div>
              )}
            </div>

            <button 
              onClick={askMaster}
              disabled={isAiLoading}
              className="mt-6 w-full py-4 bg-gradient-to-br from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Consult the Master <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </main>

      <footer className="mt-auto pt-16 pb-8 text-center text-[10px] text-neutral-600 font-bold uppercase tracking-[0.5em]">
        ZenGo Global P2P Infrastructure v4.0 • Built for Mastery
      </footer>
    </div>
  );
};

export default App;
