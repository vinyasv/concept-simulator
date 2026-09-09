import { useCallback, useMemo, useRef, useState } from "react";
import { INITIAL_CODE_STUB } from "../constants";
import {
  fixSimulationCode,
  planAndGenerateSimulation,
} from "../services/geminiService";
import { suggestionsFromSpecification } from "../simulations/validation";
import {
  AppStatus,
  ChatMessage,
  FileData,
  LibraryItem,
  LogEntry,
} from "../types";

interface PendingClarification {
  originalRequest: string;
  question: string;
}

interface BuildOptions {
  allowClarification: boolean;
  cachedCode?: string;
}

const encodeText = (text: string) =>
  btoa(unescape(encodeURIComponent(text)));

const toFileData = (topic: string): FileData => {
  const name =
    topic
      .split(/[.!?\n]/)[0]
      .trim()
      .slice(0, 56)
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase() || "custom_concept";

  return {
    name: `${name}.txt`,
    type: "text/plain",
    data: encodeText(topic),
    category: "Custom",
  };
};

const chatMessage = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
  timestamp: new Date(),
});

export const useSimulationWorkspace = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [simulationCode, setSimulationCode] = useState(INITIAL_CODE_STUB);
  const [isCachedSession, setIsCachedSession] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [simulationSnapshot, setSimulationSnapshot] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [clarification, setClarification] = useState<PendingClarification | null>(null);
  const repairRequestRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const requestIdRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message,
        type,
      },
    ]);
  }, []);

  const runBuild = useCallback(
    async (file: FileData, options: BuildOptions) => {
      const requestId = ++requestIdRef.current;
      setCurrentFile(file);
      setSimulationSnapshot(null);
      setLogs([]);
      setSuggestions([]);
      setClarification(null);
      retryCountRef.current = 0;
      addLog(`Opening ${file.name}`, "system");

      if (options.cachedCode) {
        setSimulationCode(options.cachedCode);
        setIsCachedSession(true);
        setStatus(AppStatus.READY);
        addLog("Simulation ready", "success");
        return;
      }

      setStatus(AppStatus.ANALYZING);
      setIsCachedSession(false);
      addLog("Building simulation", "info");

      try {
        const result = await planAndGenerateSimulation(
          file.data,
          file.type,
          (message) => addLog(message, "info"),
          options.allowClarification,
        );
        if (requestIdRef.current !== requestId) return;

        if (result.kind === "clarify") {
          const originalRequest =
            file.type === "text/plain"
              ? new TextDecoder().decode(
                  Uint8Array.from(atob(file.data), (character) =>
                    character.charCodeAt(0),
                  ),
                )
              : file.name;
          setCurrentFile(null);
          setStatus(AppStatus.IDLE);
          setClarification({ originalRequest, question: result.question });
          setConversation((previous) => [
            ...previous,
            chatMessage("ai", result.question),
          ]);
          return;
        }

        setSimulationCode(result.code);
        setSuggestions(suggestionsFromSpecification(result.specification));
        setStatus(AppStatus.READY);
        addLog("Simulation ready", "success");
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        setStatus(AppStatus.ERROR);
        addLog(
          error instanceof Error ? error.message : "Unable to build simulation",
          "error",
        );
      }
    },
    [addLog],
  );

  const createFromPrompt = useCallback(
    async (answer: string) => {
      const normalized = answer.trim();
      if (!normalized || status === AppStatus.ANALYZING) return;

      const pending = clarification;
      const request = pending
        ? `${pending.originalRequest}\n\nClarification question: ${pending.question}\nAnswer: ${normalized}`
        : normalized;

      setConversation((previous) => [
        ...previous,
        chatMessage("user", normalized),
      ]);
      await runBuild(toFileData(request), { allowClarification: true });
    },
    [clarification, runBuild, status],
  );

  const selectFile = useCallback(
    async (file: FileData, cachedCode?: string) => {
      setConversation([]);
      await runBuild(file, { allowClarification: false, cachedCode });
    },
    [runBuild],
  );

  const selectLibraryItem = useCallback(
    (item: LibraryItem) => {
      void selectFile(item.fileData, item.cachedCode);
    },
    [selectFile],
  );

  const buildFromConversation = useCallback(
    (topic: string, mode: "create" | "update") => {
      const nextFile =
        mode === "update" && currentFile
          ? {
              ...currentFile,
              type: "text/plain",
              data: encodeText(topic),
              category: "Custom",
            }
          : toFileData(topic);

      void runBuild(nextFile, { allowClarification: false });
    },
    [currentFile, runBuild],
  );

  const regenerate = useCallback(async () => {
    if (!currentFile) return;
    await runBuild(currentFile, { allowClarification: false });
  }, [currentFile, runBuild]);

  const handleSimulationError = useCallback(
    async (message: string) => {
      if (
        status === AppStatus.ERROR ||
        isCachedSession ||
        repairRequestRef.current === requestIdRef.current
      )
        return;
      const requestId = requestIdRef.current;
      if (retryCountRef.current >= 2) {
        setStatus(AppStatus.ERROR);
        addLog("Automatic repair stopped after two attempts", "error");
        return;
      }

      repairRequestRef.current = requestId;
      setSimulationSnapshot(null);
      retryCountRef.current += 1;
      setStatus(AppStatus.ANALYZING);
      addLog(
        `Repairing the simulation · attempt ${retryCountRef.current} of 2`,
        "warning",
      );

      try {
        const fixedCode = await fixSimulationCode(simulationCode, message, (log) =>
          addLog(log, "info"),
        );
        if (requestIdRef.current !== requestId) return;
        setSimulationCode(fixedCode);
        setStatus(AppStatus.READY);
        addLog("Repair applied", "success");
      } catch {
        if (requestIdRef.current !== requestId) return;
        setStatus(AppStatus.ERROR);
        addLog("Automatic repair failed", "error");
      } finally {
        if (repairRequestRef.current === requestId)
          repairRequestRef.current = null;
      }
    },
    [addLog, isCachedSession, simulationCode, status],
  );

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
    setConversation([]);
    setClarification(null);
  }, []);

  const appendConversation = useCallback((message: ChatMessage) => {
    setConversation((previous) => [...previous, message]);
  }, []);

  const latestLog = useMemo(() => logs.at(-1) ?? null, [logs]);
  const isProcessing =
    status === AppStatus.ANALYZING || status === AppStatus.GENERATING;

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
    conversation,
    clarification,
    createFromPrompt,
    selectFile,
    selectLibraryItem,
    buildFromConversation,
    regenerate,
    handleSimulationError,
    appendConversation,
    reset,
  };
};

export type SimulationWorkspace = ReturnType<typeof useSimulationWorkspace>;
