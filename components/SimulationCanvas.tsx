import React, { useEffect, useRef, useState, ReactNode, ErrorInfo } from 'react';
import { createRoot, Root } from 'react-dom/client';
import * as Recharts from 'recharts';
import * as LucideReact from 'lucide-react';
import { Activity, RefreshCw } from 'lucide-react';
import { SimFrame, Control, Stat } from './SimSDK';

interface SimulationCanvasProps {
  code: string;
  onRegenerate?: () => void;
  onError?: (error: string) => void;
  isCached?: boolean;
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

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ code, onRegenerate, onError, isCached }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When props.onError is triggered, we want to call it. 
  // We use a ref to keep it stable in the scope creation
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    setError(null);

    const rootElement = containerRef.current;
    
    if (rootRef.current) {
      try {
        rootRef.current.unmount();
      } catch (e) {
        console.warn("Failed to unmount previous root", e);
      }
      rootRef.current = null;
    }

    rootElement.innerHTML = "";

    try {
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

      // Normalize modules to handle both default and named exports
      // @ts-ignore
      const RechartsModule = Recharts.default || Recharts;
      // @ts-ignore
      const LucideModule = { ...LucideReact, ...(LucideReact.default || {}) };

      const customRequire = (moduleName: string) => {
        if (moduleName === 'react') return React;
        if (moduleName === 'recharts') return { ...RechartsModule, ...reactHooks };
        // Handle all variations of lucide-react imports
        if (moduleName === 'lucide-react' || moduleName === 'lucide_react' || moduleName.startsWith('lucide-react')) {
            return { ...LucideModule, ...reactHooks };
        }
        console.warn(`Simulation attempted to require unknown module: ${moduleName}`);
        return {}; 
      };

      const exportsObj = {};
      const moduleObj = { exports: exportsObj };

      const handleError = (e: Error | string) => {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
          if (onErrorRef.current) {
              onErrorRef.current(msg);
          }
      };

      // Provide extensive scope to catch hallucinated variables
      const scope = {
        React,
        ...React,
        // UI SDK
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
            const internalRoot = createRoot(rootElement);
            rootRef.current = internalRoot;
            internalRoot.render(
                <ErrorBoundary onError={(e) => handleError(e)}>
                    {component}
                </ErrorBoundary>
            );
        }
      };

      // @ts-ignore
      if (!window.Babel) {
        throw new Error("Babel not loaded. Cannot compile simulation.");
      }

      // Remove export default and other potential syntax issues
      const cleanCode = code
        .replace(/^\s*export\s+default\s+[\w\d_]+;?/gm, '')
        .replace(/^\s*import\s+.*?;/gm, ''); // We handle imports via require logic in transpilation usually, but simple cleaning helps

      // @ts-ignore
      const transpiled = window.Babel.transform(code, {
        presets: ['react', 'env'],
        filename: 'simulation.tsx',
      }).code;

      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);
      
      const executable = new Function(...scopeKeys, transpiled);
      executable(...scopeValues);

    } catch (err) {
      console.error("Simulation Runtime Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown runtime error";
      setError(msg);
      // Trigger error callback for immediate compilation errors
      if (onErrorRef.current) onErrorRef.current(msg);
    }
    
    return () => {
        if (rootRef.current) {
            try {
                rootRef.current.unmount();
            } catch(e) {}
            rootRef.current = null;
        }
    };

  }, [code]);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden flex flex-col">
       <div className="flex-none h-10 border-b border-[#E0E0E0] bg-[#FEFEFE] flex items-center justify-end px-4 gap-2 z-10">
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
       </div>

       <div ref={containerRef} className="flex-1 w-full min-h-0 relative z-0 overflow-y-auto" id="simulation-root"></div>

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