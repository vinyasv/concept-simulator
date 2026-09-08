import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, BookOpen, Sparkles, X } from 'lucide-react';
import { processArchitectChat } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ConceptCreatorProps {
  initialPrompt?: string;
  isProcessing: boolean;
  onBrowse: () => void;
  onClose: () => void;
  onGenerate: (topic: string) => void;
}

const starters = [
  'How does a double pendulum become chaotic?',
  'Show how sorting algorithms compare',
  'Model how an epidemic spreads',
];

const ConceptCreator: React.FC<ConceptCreatorProps> = ({
  initialPrompt = '',
  isProcessing,
  onBrowse,
  onClose,
  onGenerate,
}) => {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const initialPromptSent = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const normalized = text.trim();
    if (!normalized || isThinking || isProcessing) return;

    const previousMessages = messages;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: normalized,
      timestamp: new Date(),
    };

    setMessages(previous => [...previous, userMessage]);
    setDraft('');
    setError('');
    setIsThinking(true);

    try {
      const response = await processArchitectChat(normalized, previousMessages);
      setMessages(previous => [...previous, {
        id: crypto.randomUUID(),
        role: 'ai',
        text: response.text || 'Ready to build.',
        timestamp: new Date(),
      }]);

      if (response.action?.type === 'generate') {
        onGenerate(response.action.topic);
      }
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Could not send your request. Try again.');
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (!initialPrompt.trim() || initialPromptSent.current) return;
    initialPromptSent.current = true;
    void send(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [error, isThinking, messages]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  return (
    <section className="concept-creator" aria-label="Create a concept simulation">
      <header className="concept-creator__header">
        <div>
          <p className="eyebrow">New simulation</p>
          <h2>What should the simulation show?</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close concept creator">
          <X size={18} />
        </button>
      </header>

      <div className="concept-creator__messages">
        {messages.length === 0 && !isThinking && (
          <div className="creator-empty">
            <Sparkles size={24} strokeWidth={1.4} />
            <p>Name a topic and what you want to test.</p>
            <div className="creator-starters">
              {starters.map(starter => (
                <button key={starter} onClick={() => void send(starter)} type="button">
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <article className={`creator-message creator-message--${message.role}`} key={message.id}>
            <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
            <p>{message.text}</p>
          </article>
        ))}

        {isThinking && <p className="creator-thinking">Reading your request</p>}
        {error && <p className="creator-error" role="alert">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="concept-creator__footer">
        <form className="creator-composer" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="creator-input">Describe a concept</label>
          <textarea
            autoFocus
            disabled={isThinking || isProcessing}
            id="creator-input"
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (draft.trim()) void send(draft);
              }
            }}
            placeholder="Describe what you want to simulate"
            rows={3}
            value={draft}
          />
          <button disabled={!draft.trim() || isThinking || isProcessing} type="submit" aria-label="Send concept">
            <ArrowUp size={17} />
          </button>
        </form>
        <button className="creator-browse" onClick={onBrowse} type="button">
          <BookOpen size={14} /> Browse simulations
        </button>
      </div>
    </section>
  );
};

export default ConceptCreator;
