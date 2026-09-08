import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  LoaderCircle,
  ArrowUpRight,
  PanelRightClose,
  X,
} from "lucide-react";
import { processWorkspaceChat } from "../services/geminiService";
import { ChatMessage, FileData } from "../types";

interface FreshAssistantProps {
  file: FileData | null;
  simulationSnapshot?: string | null;
  mode: "drawer" | "sheet" | "workspace";
  onClose: () => void;
  onGenerate?: (topic: string, mode: "create" | "update") => void;
  isProcessing?: boolean;
  suggestions: string[];
}

interface BuildEvent {
  id: string;
  mode: "create" | "update";
  topic: string;
  started: boolean;
}

const FreshAssistant: React.FC<FreshAssistantProps> = ({
  file,
  simulationSnapshot,
  mode,
  onClose,
  onGenerate,
  isProcessing = false,
  suggestions,
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [buildEvent, setBuildEvent] = useState<BuildEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const currentFileRef = useRef(file);
  currentFileRef.current = file;

  useEffect(() => {
    if (isProcessing && buildEvent && !buildEvent.started) {
      setBuildEvent((previous) =>
        previous ? { ...previous, started: true } : previous,
      );
    }
  }, [buildEvent, isProcessing]);

  useEffect(() => {
    const element = messagesRef.current;
    element?.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [isLoading, messages]);

  const ask = async (text: string) => {
    const normalized = text.trim();
    if (!normalized || isLoading || isProcessing) return;
    const requestFile = file;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: normalized,
      timestamp: new Date(),
    };
    setMessages((previous) => [...previous, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await processWorkspaceChat(
        normalized,
        messages,
        requestFile,
        simulationSnapshot,
      );
      if (currentFileRef.current !== requestFile) return;
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: response.text,
          timestamp: new Date(),
        },
      ]);

      if (response.action?.type === "generate" && onGenerate) {
        setBuildEvent({
          id: crypto.randomUUID(),
          mode: response.action.mode,
          topic: response.action.topic,
          started: false,
        });
        onGenerate(response.action.topic, response.action.mode);
      }
    } catch (requestError) {
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text:
            requestError instanceof Error
              ? requestError.message
              : "Could not send your question. Try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void ask(query);
  };

  const fallbackSuggestions = [
    "What changed after my last move?",
    "Which variable should I change next?",
    "How does the order of actions affect the result?",
  ];
  const visibleSuggestions = suggestions.length
    ? suggestions
    : fallbackSuggestions;

  return (
    <section
      className={`fresh-assistant fresh-assistant--${mode}`}
      aria-label="Simulation assistant"
    >
      <header className="fresh-assistant__header">
        <div>
          <h2>Assistant</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={
            mode === "workspace" ? "Collapse conversation" : "Close assistant"
          }
        >
          {mode === "workspace" ? (
            <PanelRightClose size={16} />
          ) : (
            <X size={18} />
          )}
        </button>
      </header>

      <div className="fresh-assistant__context">
        <span className={file ? "status-dot is-ready" : "status-dot"} />
        {file
          ? `${file.name.replace(/\.[^.]+$/, "").replaceAll("_", " ")}`
          : "Choose a simulation first"}
      </div>

      <div className="fresh-assistant__messages" ref={messagesRef}>
        {messages.length === 0 && !buildEvent && (
          <div className="assistant-empty">
            <h3>Ask about this simulation</h3>
            <p>Change a value or move an object, then ask about the result.</p>
            <div className="assistant-suggestions">
              {visibleSuggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  disabled={isLoading || isProcessing}
                  onClick={() => void ask(suggestion)}
                >
                  <span>{suggestion}</span>
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <article
            className={`assistant-message assistant-message--${message.role}`}
            key={message.id}
          >
            <span>{message.role === "user" ? "You" : "Assistant"}</span>
            <p>{message.text}</p>
          </article>
        ))}
        {buildEvent && (
          <div className="assistant-build-event" aria-live="polite">
            {isProcessing || !buildEvent.started ? (
              <LoaderCircle size={14} />
            ) : (
              <Check size={14} />
            )}
            <div>
              <strong>
                {isProcessing || !buildEvent.started
                  ? buildEvent.mode === "update"
                    ? "Updating simulation"
                    : "Building simulation"
                  : "Build finished"}
              </strong>
            </div>
          </div>
        )}
        {isLoading && (
          <p className="assistant-thinking">
            Thinking<span>…</span>
          </p>
        )}
      </div>

      <div className="assistant-compose-area">
        <form className="assistant-composer" onSubmit={submit}>
          <label
            className="visually-hidden"
            htmlFor={`assistant-input-${mode}`}
          >
            Ask a question
          </label>
          <textarea
            id={`assistant-input-${mode}`}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (query.trim()) void ask(query);
              }
            }}
            placeholder="Ask a question or describe a change"
            rows={2}
            value={query}
          />
          <button
            disabled={!query.trim() || isLoading || isProcessing}
            type="submit"
            aria-label="Send question"
          >
            <ArrowUp size={17} />
          </button>
        </form>
        <p className="assistant-compose-hint">
          Enter to send <span>Shift + Enter for a new line</span>
        </p>
      </div>
    </section>
  );
};

export default FreshAssistant;
