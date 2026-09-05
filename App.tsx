import React, { useState, useCallback, useRef } from 'react';
import { Maximize2, RotateCcw, Minimize2, Grid3X3, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import LibraryPanel from './components/LibraryPanel';
import SimulationCanvas from './components/SimulationCanvas';
import QnAPanel from './components/QnAPanel';
import { analyzeAndGenerateSimulation, generateSuggestedQuestions, fixSimulationCode } from './services/geminiService';
import { LogEntry, FileData, AppStatus, LibraryItem } from './types';
import { INITIAL_CODE_STUB, LIBRARY_DATA } from './constants';
import IterationOne from './components/IterationOne';
import { useSimulationWorkspace } from './hooks/useSimulationWorkspace';

const LegacyApp = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [simulationCode, setSimulationCode] = useState<string>(INITIAL_CODE_STUB);
  const [isCachedSession, setIsCachedSession] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // Layout State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  const simulationSectionRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      message,
      type
    }]);
  }, []);

  const handleFileSelect = async (file: FileData, cachedCode?: string) => {
    setCurrentFile(file);
    setLogs([]); // Clear logs for new run
    setSuggestions([]); // Clear suggestions
    setRetryCount(0); // Reset retry count for new file
    
    addLog(`Ingesting Data: ${file.name} [${file.type}]`, 'system');
    
    // Background process: Generate suggested questions
    generateSuggestedQuestions(file).then(qs => setSuggestions(qs));

    if (cachedCode) {
        addLog("Retrieving pre-compiled simulation from cache...", 'info');
        // Small delay to simulate loading for UX
        setTimeout(() => {
            setSimulationCode(cachedCode);
            setIsCachedSession(true);
            setStatus(AppStatus.READY);
            addLog("Cache hit. Environment restored.", 'success');
        }, 500);
        return;
    }

    // Normal AI Generation Path
    setStatus(AppStatus.ANALYZING);
    setIsCachedSession(false);
    addLog("Initializing Reasoning Core...", 'info');

    try {
      const generatedCode = await analyzeAndGenerateSimulation(
        file.data, 
        file.type, 
        (msg) => addLog(msg, 'info')
      );
      
      setSimulationCode(generatedCode);
      setStatus(AppStatus.READY);
      addLog("Environment Rendered Successfully.", 'success');
      
    } catch (error) {
      setStatus(AppStatus.ERROR);
      addLog(`Fatal Error: ${error}`, 'error');
    }
  };

  const handleRegenerate = async () => {
    if (!currentFile) return;
    
    setRetryCount(0);
    addLog("Forcing re-generation from source...", 'warning');
    setStatus(AppStatus.ANALYZING);
    setIsCachedSession(false);

    try {
      const generatedCode = await analyzeAndGenerateSimulation(
        currentFile.data, 
        currentFile.type, 
        (msg) => addLog(msg, 'info')
      );
      
      setSimulationCode(generatedCode);
      setStatus(AppStatus.READY);
      addLog("Re-generation complete.", 'success');
      
    } catch (error) {
      setStatus(AppStatus.ERROR);
      addLog(`Fatal Error: ${error}`, 'error');
    }
  };

  const handleSimulationError = async (errorMsg: string) => {
    if (status === AppStatus.ERROR || isCachedSession) return; // Don't loop on already errored or cached
    
    if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setStatus(AppStatus.ANALYZING); // Show progress bar
        addLog(`Runtime Crash Detected: ${errorMsg.substring(0, 30)}...`, 'error');
        addLog(`Initiating Auto-Correction Protocol (Attempt ${retryCount + 1}/2)...`, 'warning');
        
        try {
            const fixedCode = await fixSimulationCode(simulationCode, errorMsg, (msg) => addLog(msg, 'info'));
            setSimulationCode(fixedCode);
            setStatus(AppStatus.READY);
            addLog("Auto-Correction Applied. Rebooting Environment.", 'success');
        } catch (e) {
            setStatus(AppStatus.ERROR);
            addLog("Auto-Correction Failed. System Halted.", 'error');
        }
    } else {
        setStatus(AppStatus.ERROR);
        addLog("Max retries exceeded. Manual intervention required.", 'error');
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setCurrentFile(null);
    setSimulationCode(INITIAL_CODE_STUB);
    setLogs([]);
    setSuggestions([]);
    setIsCachedSession(false);
    setRetryCount(0);
  };

  const toggleFullscreen = useCallback(() => {
    if (!simulationSectionRef.current) return;

    if (!document.fullscreenElement) {
      simulationSectionRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Fullscreen Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Get the latest log for the footer
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F4F4F4] text-black font-sans">
      
      {/* Header */}
      <header className="h-12 shrink-0 border-b border-[#E0E0E0] bg-[#F4F4F4] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
           {/* Left Panel Toggle - Explicit Button */}
          <button 
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border ${showLeftPanel ? 'bg-[#E0E0E0] text-black border-[#CCCCCC]' : 'bg-white text-black border-[#E0E0E0] hover:bg-[#F0F0F0]'}`}
            title={showLeftPanel ? "Collapse Library" : "Expand Library"}
          >
            {showLeftPanel ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span>Library</span>
          </button>

          <div className="h-4 w-px bg-[#E0E0E0]"></div>

          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-black flex items-center justify-center">
                <Grid3X3 size={14} className="text-white" />
            </div>
            <h1 className="font-bold tracking-tight text-black text-xs uppercase">Concept Simulator <span className="text-[#999999] font-normal mx-2">/</span> <span className="text-[#757575] font-mono">v4.1.ARC</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 hover:bg-[#E0E0E0] px-2 py-1 transition-colors text-[#555555] hover:text-black"
                title="Reset System"
            >
                <RotateCcw size={12} />
                <span className="text-[10px] uppercase font-bold tracking-wide">Reset</span>
            </button>
            
            <div className="h-4 w-px bg-[#E0E0E0]"></div>

            {/* Right Panel Toggle - Explicit Button */}
            <button 
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border ${showRightPanel ? 'bg-[#E0E0E0] text-black border-[#CCCCCC]' : 'bg-white text-black border-[#E0E0E0] hover:bg-[#F0F0F0]'}`}
                title={showRightPanel ? "Collapse Chat" : "Expand Chat"}
            >
                <span>Chat</span>
                {showRightPanel ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </button>
        </div>
      </header>

      {/* Main Content: 3-Column Grid */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Column 1: Library & Input (Collapsible) */}
        {showLeftPanel && (
            <section className="w-[20%] min-w-[250px] max-w-[350px] border-r border-[#E0E0E0] bg-[#F9F9F9] flex flex-col z-10">
            {/* Update LibraryPanel to pass cachedCode if available */}
            <LibraryPanel 
                onFileSelect={(file) => {
                    // Find if this file belongs to a library item with cached code
                    let cachedCode: string | undefined;
                    for(const cat of LIBRARY_DATA) {
                        for(const sub of cat.subcategories) {
                            const item = sub.items.find(i => i.fileData.name === file.name);
                            if(item) cachedCode = item.cachedCode;
                        }
                    }
                    handleFileSelect(file, cachedCode);
                }} 
                isProcessing={status === AppStatus.ANALYZING} 
            />
            </section>
        )}

        {/* Column 2: Simulation Canvas (Dynamic Width) */}
        <section 
          ref={simulationSectionRef}
          className="flex-1 h-full bg-white relative flex flex-col min-w-0 border-r border-[#E0E0E0]"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#E0E0E0] z-20">
            <div 
                className="h-full bg-black transition-all duration-300" 
                style={{ width: status === AppStatus.ANALYZING ? '40%' : status === AppStatus.READY ? '100%' : '0%', opacity: status === AppStatus.IDLE ? 0 : 1 }}
            ></div>
          </div>
          
          <div className="flex-1 w-full h-full relative flex flex-col min-h-0">
             <SimulationCanvas 
                code={simulationCode} 
                isCached={isCachedSession}
                onRegenerate={handleRegenerate}
                onError={handleSimulationError}
             />
          </div>

          {/* Canvas Footer / Status Bar */}
          <div className="h-8 shrink-0 border-t border-[#E0E0E0] bg-[#F4F4F4] flex items-center justify-between px-4 text-[10px] text-[#555555] font-mono">
             
             {/* Dynamic Log Area */}
             <div className="flex items-center gap-3 overflow-hidden max-w-[40%]">
                 {latestLog && (
                    <>
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${latestLog.type === 'error' ? 'bg-red-600' : 'bg-black animate-pulse'}`}></div>
                        <span className={`truncate font-bold uppercase tracking-wider ${latestLog.type === 'error' ? 'text-red-600' : 'text-[#333]'}`}>
                            {latestLog.message}
                        </span>
                    </>
                 )}
                 {!latestLog && <span className="text-[#999] uppercase tracking-wider">System Idle</span>}
             </div>

             {/* Stats Area */}
             <div className="flex gap-4 items-center shrink-0">
                <span className="hidden xl:inline">LATENCY: 12ms</span>
                <span>RENDER: {isCachedSession ? 'CACHE' : 'AI'}</span>
                <span className="uppercase hidden md:inline truncate max-w-[100px]">{currentFile ? `SRC: ${currentFile.name}` : 'SRC: NULL'}</span>
                <button 
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 hover:text-black transition-colors cursor-pointer border-l border-[#E0E0E0] pl-4 ml-2"
                >
                    {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                    <span className="hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULL'}</span>
                </button>
             </div>
          </div>
        </section>

        {/* Column 3: QnA (Collapsible) */}
        {showRightPanel && (
            <section className="w-[25%] min-w-[280px] bg-white flex flex-col z-10">
                <QnAPanel file={currentFile} suggestions={suggestions} />
            </section>
        )}

      </main>
    </div>
  );
};

const FreshApp = () => {
  const workspace = useSimulationWorkspace();
  return <IterationOne workspace={workspace} />;
};

const RedirectToMinimal = () => {
  React.useEffect(() => {
    window.location.replace('/1');
  }, []);
  return null;
};

const App = () => {
  if (window.location.pathname === '/1') return <FreshApp />;
  if (window.location.pathname === '/2') return <RedirectToMinimal />;
  return <LegacyApp />;
};

export default App;
