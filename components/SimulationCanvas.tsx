import React, { useCallback, useEffect, useRef, useState, ReactNode, ErrorInfo } from 'react';
import * as Recharts from 'recharts';
import * as LucideReact from 'lucide-react';
import { Activity, RefreshCw } from 'lucide-react';
import { SimFrame, Control, Stat } from './SimSDK';
import { CanvasFit } from './CanvasFit';
import { TraceSimulation } from './TraceSimulation';
import { PhysicsSimulation } from './PhysicsSimulation';
import { predatorPrey } from '../simulations/physics';
import { useSimulationTimeline, PlaybackControls, ModelNotes } from '../simulations/playback';
import { seededRandom } from '../simulations/model';
import { validateRegistration, SimulationRegistration } from '../simulations/validation';
import { SimulationObservationContext, useSimulationSnapshot } from '../simulations/observation';

interface SimulationCanvasProps {
  code: string;
  onRegenerate?: () => void;
  onError?: (error: string) => void;
  isCached?: boolean;
  showToolbar?: boolean;
  onSnapshot?: (snapshot: string) => void;
}

interface ErrorBoundaryProps {
  children?: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly props!: ErrorBoundaryProps;

  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Simulation Error Boundary Caught:", error, errorInfo);
    if (this.props.onError) {
        this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-red-600 bg-red-50/50">
          <Activity size={32} className="mb-4" />
          <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Simulation Crashed</h3>
          <pre className="text-[10px] font-mono bg-white p-4 border border-red-100 rounded shadow-sm max-w-full overflow-auto">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ code, onRegenerate, onError, isCached, showToolbar = true, onSnapshot }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSimulation, setRenderedSimulation] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  // When props.onError is triggered, we want to call it. 
  // We use a ref to keep it stable in the scope creation
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const handleRenderedError = useCallback((renderError: Error) => {
    const message = renderError.message;
    setError(message);
    onErrorRef.current?.(message);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    setError(null);
    setRenderedSimulation(null);

    try {
      let compiledSimulation: ReactNode = null;
      let registered = false;
      const reactHooks = {
        useState: React.useState,
        useEffect: React.useEffect,
        useContext: React.useContext,
        useReducer: React.useReducer,
        useCallback: React.useCallback,
        useMemo: React.useMemo,
        useRef: React.useRef,
        useImperativeHandle: React.useImperativeHandle,
        useLayoutEffect: React.useLayoutEffect,
        useDebugValue: React.useDebugValue,
      };

      const RechartsModule = Recharts;
      const LucideModule = LucideReact;

      const customRequire = (moduleName: string) => {
        if (moduleName === 'react') return React;
        if (moduleName === 'recharts') return { ...RechartsModule, ...reactHooks };
        // Handle all variations of lucide-react imports
        if (moduleName === 'lucide-react' || moduleName === 'lucide_react' || moduleName.startsWith('lucide-react')) {
            return { ...LucideModule, ...reactHooks };
        }
        throw new Error(`Unsupported simulation module: ${moduleName}`);
      };

      const exportsObj = {};
      const moduleObj = { exports: exportsObj };

      // Provide extensive scope to catch hallucinated variables
      const scope = {
        React,
        ...React,
        // UI SDK
        registerSimulation: (model: SimulationRegistration) => {
          if (registered) throw new Error('Register only one simulation model.');
          validateRegistration(model);
          registered = true;
        },
        useSimulationSnapshot,
        PhysicsSimulation,
        predatorPrey,
        TraceSimulation,
        useSimulationTimeline,
        PlaybackControls,
        ModelNotes,
        seededRandom,
        SimFrame,
        Control,
        Stat,
        // Libraries
        Recharts: RechartsModule,
        LucideReact: LucideModule,
        lucide_react: LucideModule,
        lucid_react: LucideModule, // Common typo
        _lucide_react: LucideModule, // Babel transform artifact
        _lucideReact: LucideModule, // Babel transform artifact
        Lucide: LucideModule,
        lucide: LucideModule,
        require: customRequire,
        exports: exportsObj,
        module: moduleObj,
        global: window,
        render: (component: ReactNode) => {
          compiledSimulation = component;
        }
      };

      // @ts-ignore
      if (!window.Babel) {
        throw new Error("Babel not loaded. Cannot compile simulation.");
      }

      // Generated imports are compiled to calls through customRequire above.
      // Only remove a default export because simulations render through render().
      const cleanCode = code
        .replace(/^\s*export\s+default\s+[\w\d_]+;?/gm, '');

      // @ts-ignore
      const transpiled = window.Babel.transform(cleanCode, {
        presets: [
          ['react', { runtime: 'classic' }],
          ['env', { modules: 'commonjs' }],
        ],
        filename: 'simulation.tsx',
      }).code;

      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);
      
      const executable = new Function(...scopeKeys, transpiled);
      executable(...scopeValues);

      if (code.startsWith('// @simulation-model-v1') && !registered) {
        throw new Error('Generated simulation must register its assumptions and executable model checks.');
      }
      if (compiledSimulation === null) {
        throw new Error("Simulation did not render a component.");
      }
      setRenderedSimulation(compiledSimulation);

    } catch (err) {
      console.error("Simulation Runtime Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown runtime error";
      setRenderedSimulation(null);
      setError(msg);
      // Trigger error callback for immediate compilation errors
      if (onErrorRef.current) onErrorRef.current(msg);
    }
    
  }, [code]);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden flex flex-col">
       {showToolbar && <div className="flex-none h-10 border-b border-[#E0E0E0] bg-[#FEFEFE] flex items-center justify-end px-4 gap-2 z-10">
            {isCached && onRegenerate && (
                <button 
                    onClick={onRegenerate}
                    className="bg-white border border-[#E0E0E0] px-3 py-1 flex items-center gap-2 hover:bg-black hover:text-white transition-colors group"
                >
                    <RefreshCw size={10} className="group-hover:animate-spin" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Regenerate</span>
                </button>
            )}
            <div className="bg-white border border-[#E0E0E0] px-3 py-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-black font-bold tracking-wider uppercase">Live Env</span>
            </div>
       </div>}

       <div ref={containerRef} className="flex-1 w-full min-h-0 relative z-0 overflow-hidden" id="simulation-root">
         {renderedSimulation && (
           <SimulationObservationContext.Provider value={onSnapshot}><ErrorBoundary key={code} onError={handleRenderedError}>
             {/\b(?:SimFrame|TraceSimulation|PhysicsSimulation)\b/.test(code) ? renderedSimulation : <CanvasFit>{renderedSimulation}</CanvasFit>}
           </ErrorBoundary></SimulationObservationContext.Provider>
         )}
       </div>

       {error && (
         <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-8 z-50">
           <div className="border border-black p-8 max-w-lg w-full bg-white shadow-none">
             <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3 mb-4">
                <h3 className="text-black font-bold uppercase tracking-widest text-sm">Runtime Exception</h3>
                <Activity size={14} className="text-red-600" />
             </div>
             
             <div className="bg-[#F9F9F9] p-4 border border-[#E0E0E0] mb-6">
                <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap break-all">{error}</pre>
             </div>

             <div className="text-[10px] text-[#757575] font-mono leading-relaxed flex justify-between items-center">
                <span>SYSTEM HALTED. ATTEMPTING RECOVERY IF ENABLED...</span>
                <span className="animate-pulse text-red-600">●</span>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default SimulationCanvas;
