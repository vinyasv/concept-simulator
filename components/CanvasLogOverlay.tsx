import React from 'react';
import { LogEntry } from '../types';

interface CanvasLogOverlayProps {
  latestLog: LogEntry | null;
}

const CanvasLogOverlay: React.FC<CanvasLogOverlayProps> = ({ latestLog }) => {
  if (!latestLog) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 pointer-events-none max-w-[80%]">
      <div className="flex flex-col items-start gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="bg-white border border-[#E0E0E0] shadow-sm px-3 py-2 flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#999999]">
                {latestLog.type === 'error' ? 'SYSTEM_CRITICAL' : 'SYSTEM_CORE'}
            </span>
            <div className="w-px h-3 bg-[#E0E0E0]"></div>
            <span className={`text-[10px] font-mono ${latestLog.type === 'error' ? 'text-red-600 font-bold' : 'text-black'}`}>
                {latestLog.message}
            </span>
            {latestLog.type === 'info' && (
                <div className="w-1.5 h-1.5 bg-black animate-pulse ml-1"></div>
            )}
         </div>
         <div className="text-[8px] text-[#999999] font-mono pl-1">
            TS: {latestLog.timestamp.toISOString()}
         </div>
      </div>
    </div>
  );
};

export default CanvasLogOverlay;