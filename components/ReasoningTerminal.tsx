import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { LogEntry } from '../types';

interface ReasoningTerminalProps {
  logs: LogEntry[];
}

const ReasoningTerminal: React.FC<ReasoningTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#F9F9F9] font-mono text-xs border-t border-[#E0E0E0]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#E0E0E0] bg-white">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-black" />
          <span className="font-bold uppercase text-[10px] text-black tracking-widest">System Log</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-black"></div>
          <span className="text-[#757575] text-[10px] uppercase tracking-wider">Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && (
          <div className="text-[#757575] opacity-60">
            {'>'} Awaiting Process Initialization...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 group hover:bg-[#F0F0F0] -mx-4 px-4 py-0.5">
            <span className="text-[#999999] shrink-0 select-none w-20 text-right">
              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`break-words flex-1 ${log.type === 'error' ? 'text-black font-bold' :
                'text-[#333333]'
              }`}>
              {log.type === 'error' && <span className="bg-black text-white px-1 mr-2 text-[9px] uppercase">FATAL</span>}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ReasoningTerminal;