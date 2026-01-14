
import React from 'react';
import { PlayerColor } from '../types';

interface StoneProps {
  color: PlayerColor;
  isLast?: boolean;
}

const Stone: React.FC<StoneProps> = ({ color, isLast }) => {
  return (
    <div 
      className={`
        w-8 h-8 rounded-full shadow-lg relative
        ${color === 'black' 
          ? 'bg-gradient-to-br from-neutral-700 to-black border-neutral-800' 
          : 'bg-gradient-to-br from-neutral-50 to-neutral-300 border-neutral-400'}
        border transition-all duration-200 scale-90
      `}
    >
      {isLast && (
        <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${color === 'black' ? 'bg-white' : 'bg-black'} opacity-50`} />
      )}
      {/* Glossy highlight */}
      <div className="absolute top-1 left-1.5 w-2 h-2 bg-white rounded-full opacity-20 blur-[1px]" />
    </div>
  );
};

export default Stone;
