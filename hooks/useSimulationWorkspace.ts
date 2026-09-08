import { useCallback, useMemo, useRef, useState } from 'react';
import { analyzeAndGenerateSimulation, fixSimulationCode, generateSuggestedQuestions } from '../services/geminiService';
import { INITIAL_CODE_STUB } from '../constants';
import { AppStatus, FileData, LibraryItem, LogEntry } from '../types';

export const useSimulationWorkspace = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [simulationCode, setSimulationCode] = useState(INITIAL_CODE_STUB);
  const [isCachedSession, setIsCachedSession] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [simulationSnapshot, setSimulationSnapshot] = useState<string | null>(null);
  const repairRequestRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const requestIdRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(previous => [...previous, {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    }]);
  }, []);

  const selectFile = useCallback(async (file: FileData, cachedCode?: string) => {
    const requestId = ++requestIdRef.current;
    setCurrentFile(file);
    setSimulationSnapshot(null);
    setLogs([]);
    setSuggestions([]);
    retryCountRef.current = 0;
    addLog(`Opening ${file.name}`, 'system');

    generateSuggestedQuestions(file).then(questions => {
      if (requestIdRef.current === requestId) setSuggestions(questions);
    });

    if (cachedCode) {
      setSimulationCode(cachedCode);
      setIsCachedSession(true);
      setStatus(AppStatus.READY);
      addLog('Simulation ready', 'success');
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setIsCachedSession(false);
    addLog('Building simulation', 'info');

    try {
      const generatedCode = await analyzeAndGenerateSimulation(
        file.data,
        file.type,
        message => addLog(message, 'info'),
      );
      if (requestIdRef.current !== requestId) return;
      setSimulationCode(generatedCode);
      setStatus(AppStatus.READY);
      addLog('Simulation ready', 'success');
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setStatus(AppStatus.ERROR);
      addLog(error instanceof Error ? error.message : 'Unable to build simulation', 'error');
    }
  }, [addLog]);

  const selectLibraryItem = useCallback((item: LibraryItem) => {
    void selectFile(item.fileData, item.cachedCode);
  }, [selectFile]);

  const regenerate = useCallback(async () => {
    if (!currentFile) return;
    const requestId = ++requestIdRef.current;
    retryCountRef.current = 0;
    setSimulationSnapshot(null);
    setStatus(AppStatus.ANALYZING);
    setIsCachedSession(false);
    addLog('Rebuilding simulation', 'warning');

    try {
      const generatedCode = await analyzeAndGenerateSimulation(
        currentFile.data,
        currentFile.type,
        message => addLog(message, 'info'),
      );
      if (requestIdRef.current !== requestId) return;
      setSimulationCode(generatedCode);
      setStatus(AppStatus.READY);
      addLog('New version ready', 'success');
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setStatus(AppStatus.ERROR);
      addLog(error instanceof Error ? error.message : 'Unable to regenerate', 'error');
    }
  }, [addLog, currentFile]);

  const handleSimulationError = useCallback(async (message: string) => {
    if (status === AppStatus.ERROR || isCachedSession || repairRequestRef.current === requestIdRef.current) return;
    const requestId = requestIdRef.current;
    if (retryCountRef.current >= 2) {
      setStatus(AppStatus.ERROR);
      addLog('Automatic repair stopped after two attempts', 'error');
      return;
    }

    repairRequestRef.current = requestId;
    setSimulationSnapshot(null);
    retryCountRef.current += 1;
    setStatus(AppStatus.ANALYZING);
    addLog(`Repairing the simulation · attempt ${retryCountRef.current} of 2`, 'warning');

    try {
      const fixedCode = await fixSimulationCode(simulationCode, message, log => addLog(log, 'info'));
      if (requestIdRef.current !== requestId) return;
      setSimulationCode(fixedCode);
      setStatus(AppStatus.READY);
      addLog('Repair applied', 'success');
    } catch {
      if (requestIdRef.current !== requestId) return;
      setStatus(AppStatus.ERROR);
      addLog('Automatic repair failed', 'error');
    } finally {
      if (repairRequestRef.current === requestId) repairRequestRef.current = null;
    }
  }, [addLog, isCachedSession, simulationCode, status]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    retryCountRef.current = 0;
    setStatus(AppStatus.IDLE);
    setCurrentFile(null);
    setSimulationSnapshot(null);
    setSimulationCode(INITIAL_CODE_STUB);
    setIsCachedSession(false);
    setSuggestions([]);
    setLogs([]);
  }, []);

  const latestLog = useMemo(() => logs.at(-1) ?? null, [logs]);
  const isProcessing = status === AppStatus.ANALYZING || status === AppStatus.GENERATING;

  return {
    status,
    currentFile,
    simulationCode,
    simulationSnapshot,
    setSimulationSnapshot,
    isCachedSession,
    suggestions,
    latestLog,
    isProcessing,
    selectFile,
    selectLibraryItem,
    regenerate,
    handleSimulationError,
    reset,
  };
};

export type SimulationWorkspace = ReturnType<typeof useSimulationWorkspace>;
