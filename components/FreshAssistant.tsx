import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
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
  messages: ChatMessage[];
  onMessage: (message: ChatMessage) => void;
  isProcessing?: boolean;
  suggestions: string[];
}

const FreshAssistant: React.FC<FreshAssistantProps> = ({
  file,
  simulationSnapshot,
  mode,
  onClose,
  onGenerate,
  messages,
  onMessage,
  isProcessing = false,
  suggestions,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const currentFileRef = useRef(file);
  currentFileRef.current = file;

  useEffect(() => {
    const element = messagesRef.current;
    element?.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [isLoading, isProcessing, messages]);

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
    onMessage(userMessage);
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
      onMessage({
        id: crypto.randomUUID(),
        role: "ai",
        text: response.text,
        timestamp: new Date(),
      });

      if (response.action?.type === "generate" && onGenerate) {
        onGenerate(response.action.topic, response.action.mode);
      }
    } catch (requestError) {
      onMessage({
        id: crypto.randomUUID(),
        role: "ai",
        text:
          requestError instanceof Error
            ? requestError.message
            : "Could not send your question. Try again.",
        timestamp: new Date(),
      });
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
        {messages.length === 0 && !isProcessing && (
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
        {isProcessing && (
          <div className="assistant-build-event" aria-live="polite">
            <LoaderCircle size={14} />
            <div>
              <strong>Building simulation</strong>
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
