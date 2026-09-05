import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, SquareTerminal, MessageSquare } from 'lucide-react';
import { ChatMessage, FileData } from '../types';
import { processChat } from '../services/geminiService';

interface QnAPanelProps {
  file: FileData | null;
  suggestions?: string[];
  onGenerateFromChat?: (topic: string) => void;
}

const QnAPanel: React.FC<QnAPanelProps> = ({ file, suggestions = [] }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track the current file to handle race conditions and resets
  const currentFileRef = useRef<FileData | null>(file);

  useEffect(() => {
    // Reset chat when file changes
    if (file !== currentFileRef.current) {
        setMessages([]);
        setQuery('');
        setIsLoading(false);
        currentFileRef.current = file;
    }
  }, [file]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleQuery = async (textToAsk: string) => {
    if (!textToAsk.trim() || isLoading) return;

    // Capture the file active when request starts
    const requestFile = file;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: textToAsk,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const historyPayload = [...messages]; 
      const result = await processChat(userMsg.text, historyPayload, requestFile);
      
      if (currentFileRef.current !== requestFile) {
          return;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'ai',
        text: result.text,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      if (currentFileRef.current !== requestFile) return;

      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'ai',
        text: error instanceof Error
          ? error.message
          : 'The assistant is temporarily unavailable. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      if (currentFileRef.current === requestFile) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(query);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4] text-black font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E0E0E0] bg-[#F4F4F4] flex items-center justify-between">
         <div className="flex items-center gap-2">
            <SquareTerminal size={14} className="text-black" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-black font-sans">
                Context Inquiry
            </span>
         </div>
         <div className="flex items-center gap-1.5 px-2 py-0.5 border border-[#E0E0E0] bg-white">
            <FileText size={10} className={file ? "text-black" : "text-[#CCCCCC]"} />
            <span className="text-[9px] text-[#757575] uppercase tracking-wide font-mono">
                {file ? "CTX:LOADED" : "CTX:NONE"}
            </span>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#999999] space-y-4 opacity-60">
             <MessageSquare size={24} strokeWidth={1} />
             <p className="text-xs">
                {file 
                    ? "Inquire about the active context..." 
                    : "Load a simulation to ask questions..."}
             </p>
             {suggestions.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 w-full max-w-[200px]">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleQuery(s)}
                            className="text-[10px] border border-[#E0E0E0] bg-white py-1.5 px-3 hover:border-black hover:text-black transition-colors text-left"
                        >
                            {s}
                        </button>
                    ))}
                </div>
             )}
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              max-w-[90%] px-3 py-2 text-xs leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-black text-white' 
                : 'bg-white border border-[#E0E0E0] text-[#333]'
              }
            `}>
              {msg.text}
            </div>
            <span className="text-[9px] text-[#999999] mt-1 font-mono">
                {msg.role === 'user' ? 'USER' : 'SYSTEM'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start">
             <div className="bg-white border border-[#E0E0E0] px-3 py-2">
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-black animate-bounce"></div>
                    <div className="w-1 h-1 bg-black animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-black animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#E0E0E0] bg-white">
        <div className="relative flex items-center">
            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={file ? "Ask about this file..." : "Ask a general question..."}
            className="w-full bg-[#F9F9F9] text-black text-xs px-3 py-2.5 pr-10 border border-[#E0E0E0] focus:outline-none focus:border-black transition-colors placeholder:text-[#999]"
            disabled={isLoading}
            />
            <button 
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2 p-1 text-black disabled:opacity-30 hover:bg-[#E0E0E0] rounded-sm transition-colors"
            >
                <Send size={14} />
            </button>
        </div>
      </form>
    </div>
  );
};

export default QnAPanel;
