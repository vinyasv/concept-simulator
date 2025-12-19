import React from 'react';

// --- THE SIMULATION BOILERPLATE SDK ---

interface SimFrameProps {
  title: string;
  description: string;
  controls?: React.ReactNode;
  stats?: React.ReactNode;
  children: React.ReactNode;
}

export const SimFrame: React.FC<SimFrameProps> = ({ title, description, controls, stats, children }) => {
  return (
    <div className="h-full w-full flex flex-col font-mono text-xs bg-white text-black overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex-none border-b border-[#E0E0E0] p-6 bg-white shrink-0">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2 text-black">{title}</h2>
        <p className="text-sm text-[#555555] max-w-4xl leading-relaxed">{description}</p>
      </div>

      {/* CONTROLS & STATS BAR */}
      {/* FIX: Added max-height and overflow to prevent controls from eating the entire screen on small displays or complex sims */}
      {(controls || stats) && (
        <div className="flex-none border-b border-[#E0E0E0] bg-[#F9F9F9] shrink-0 max-h-[35vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row min-h-min">
             {/* Controls Area */}
             {controls && (
                <div className={`p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 ${stats ? 'lg:w-2/3 lg:border-r border-[#E0E0E0]' : 'w-full'}`}>
                    {controls}
                </div>
             )}
             
             {/* Stats Area */}
             {stats && (
                <div className={`p-4 flex flex-wrap content-start gap-4 ${controls ? 'lg:w-1/3' : 'w-full'}`}>
                    {stats}
                </div>
             )}
          </div>
        </div>
      )}

      {/* VISUALIZATION CANVAS */}
      <div className="flex-1 min-h-0 relative w-full h-full p-4 overflow-hidden bg-white">
        <div className="w-full h-full border border-[#E0E0E0] relative overflow-hidden bg-[#FAFAFA]">
            {children}
        </div>
      </div>
    </div>
  );
};

interface ControlProps {
  label: string;
  value?: string | number;
  children: React.ReactNode;
}

export const Control: React.FC<ControlProps> = ({ label, value, children }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <div className="flex justify-between items-baseline gap-2">
        <label className="uppercase text-[10px] font-bold text-[#777] tracking-wider truncate shrink-0">{label}</label>
        {value !== undefined && (
            <span className="font-mono text-[10px] text-black bg-white border border-[#E0E0E0] px-1.5 truncate max-w-[50%]">
                {value}
            </span>
        )}
      </div>
      <div className="w-full relative">
        {children}
      </div>
    </div>
  );
};

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export const Stat: React.FC<StatProps> = ({ label, value, unit, highlight }) => {
  return (
    <div className={`flex flex-col items-start px-3 py-2 border min-w-[100px] max-w-[200px] ${highlight ? 'bg-black text-white border-black' : 'bg-white text-black border-[#E0E0E0]'}`}>
        <span className={`text-[9px] uppercase tracking-widest mb-1 truncate w-full ${highlight ? 'text-[#999]' : 'text-[#777]'}`}>{label}</span>
        <div className="text-lg font-bold leading-none truncate w-full flex items-baseline gap-1">
            <span>{value}</span>
            {unit && <span className="text-[10px] font-normal opacity-70 shrink-0">{unit}</span>}
        </div>
    </div>
  );
};