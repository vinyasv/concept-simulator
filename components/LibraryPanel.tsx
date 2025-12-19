import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Folder, FileCode, ChevronRight, ChevronDown, FolderOpen, Database, AlertCircle, ExternalLink, MessageSquare, Send, Sparkles, Paperclip } from 'lucide-react';
import { FileData, LibraryCategory, ChatMessage } from '../types';
import { LIBRARY_DATA } from '../constants';
import { processArchitectChat } from '../services/geminiService';

interface LibraryPanelProps {
  onFileSelect: (file: FileData) => void;
  isProcessing: boolean;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onFileSelect, isProcessing }) => {
  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Library State
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'science': true,
    'science-physics': true,
    'papers': true,
    'papers-paper-phys': true,
    'papers-paper-cs': true,
    'papers-paper-bio': true
  });

  // Architect/Chat State
  const [architectInput, setArchitectInput] = useState('');
  const [architectHistory, setArchitectHistory] = useState<ChatMessage[]>([]);
  const [isArchitectThinking, setIsArchitectThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported Format");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      onFileSelect({
        name: file.name,
        type: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile, isProcessing]);

  // Architect Chat Handler
  const handleArchitectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!architectInput.trim() || isArchitectThinking || isProcessing) return;

    const userText = architectInput;
    setArchitectInput('');
    
    // Add user message
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: userText,
        timestamp: new Date()
    };
    
    setArchitectHistory(prev => [...prev, userMsg]);
    setIsArchitectThinking(true);

    try {
        const response = await processArchitectChat(userText, architectHistory);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            text: response.text,
            timestamp: new Date()
        };
        setArchitectHistory(prev => [...prev, aiMsg]);

        if (response.action && response.action.type === 'generate') {
            // Trigger generation via Synthetic File
            const synthFile: FileData = {
                name: "architect_spec.txt",
                type: "text/plain",
                data: btoa(response.action.topic) // encode topic as base64 content
            };
            onFileSelect(synthFile);
        }

    } catch (err) {
        console.error(err);
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            text: "Connection failure. Please try again.",
            timestamp: new Date()
        };
        setArchitectHistory(prev => [...prev, errorMsg]);
    } finally {
        setIsArchitectThinking(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [architectHistory]);

  return (
    <div className="flex flex-col h-full bg-[#F9F9F9] text-black font-sans">
      
      {/* UNIFIED INPUT STUDIO (Import + Chat) */}
      <div 
        className={`
          shrink-0 border-b border-[#E0E0E0] bg-white relative transition-colors
          ${isDragging ? 'bg-[#F0F0F0]' : ''}
        `}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); !isProcessing && setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
         {/* Drag Overlay Indication */}
         {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px] pointer-events-none">
                <div className="bg-white border border-black shadow-lg px-4 py-2 flex items-center gap-2">
                    <Upload size={14} className="animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-widest">Drop File to Import</span>
                </div>
            </div>
         )}

         {/* Header */}
         <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F4F4F4]">
            <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-black" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Input Studio</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-[#999] uppercase tracking-wide">
                <span>Text</span>
                <span className="w-px h-2 bg-[#CCC]"></span>
                <span>File</span>
            </div>
         </div>

         {/* Chat History View */}
         {architectHistory.length > 0 && (
            <div ref={chatScrollRef} className="max-h-[150px] overflow-y-auto p-3 space-y-3 border-b border-[#E0E0E0] bg-white">
                {architectHistory.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] px-2 py-1.5 text-[10px] ${msg.role === 'user' ? 'bg-[#E0E0E0] text-black' : 'bg-black text-white'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isArchitectThinking && (
                    <div className="flex items-start">
                        <div className="px-2 py-1 bg-black text-white text-[9px] animate-pulse">Thinking...</div>
                    </div>
                )}
            </div>
         )}

         {/* Combined Input Bar */}
         <div className="p-3">
            <form onSubmit={handleArchitectSubmit} className="flex gap-2 items-center bg-[#F9F9F9] border border-[#E0E0E0] px-2 py-1.5 focus-within:border-black transition-colors">
                
                {/* File Attachment Button */}
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-[#E0E0E0] rounded-sm transition-colors text-[#555] hover:text-black shrink-0"
                    title="Attach File"
                    disabled={isProcessing}
                >
                    <Paperclip size={14} />
                </button>
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    disabled={isProcessing}
                />

                {/* Text Input */}
                <input 
                    type="text" 
                    value={architectInput}
                    onChange={(e) => setArchitectInput(e.target.value)}
                    placeholder="Describe a concept or attach a file..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs placeholder:text-[#999] min-w-0"
                    disabled={isArchitectThinking || isProcessing}
                />

                {/* Send Button */}
                <button 
                    type="submit" 
                    disabled={!architectInput.trim() || isArchitectThinking || isProcessing}
                    className="p-1.5 text-black disabled:opacity-30 hover:opacity-70 shrink-0"
                >
                    <Send size={14} />
                </button>
            </form>
            
            {/* Quick Status / Error */}
            {error && (
                <div className="text-[9px] text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={8}/> {error}
                </div>
            )}
         </div>
      </div>

      {/* Library Tree */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#F9F9F9]">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-[#E0E0E0]">
            <Database size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pre-Built Modules</span>
        </div>

        <div className="space-y-1">
          {LIBRARY_DATA.map((category) => (
            <div key={category.id} className="select-none">
              {/* Category Header */}
              <div 
                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#EAEAEA] px-2 -mx-2 group"
                onClick={() => toggleExpand(category.id)}
              >
                {expandedCategories[category.id] 
                    ? <FolderOpen size={12} className="text-black" /> 
                    : <Folder size={12} className="text-[#757575] group-hover:text-black" />
                }
                <span className="text-xs font-bold uppercase tracking-wide">{category.label}</span>
              </div>

              {/* Subcategories */}
              {expandedCategories[category.id] && (
                <div className="ml-2 border-l border-[#E0E0E0] pl-2 mt-1 space-y-1">
                  {category.subcategories.map((sub) => {
                    const subId = `${category.id}-${sub.id}`;
                    return (
                        <div key={sub.id}>
                            <div 
                                className="flex items-center gap-2 py-1 cursor-pointer hover:text-black text-[#555555] px-1"
                                onClick={() => toggleExpand(subId)}
                            >
                                <span className="text-[10px] uppercase font-semibold">{sub.label}</span>
                                {expandedCategories[subId] ? <ChevronDown size={8}/> : <ChevronRight size={8}/>}
                            </div>

                            {/* Items */}
                            {expandedCategories[subId] && (
                                <div className="ml-2 space-y-0.5 mb-2">
                                    {sub.items.map((item) => (
                                        <div key={item.id} className="flex items-center w-full group hover:bg-white border border-transparent hover:border-[#E0E0E0] transition-all py-1.5 px-2 gap-2">
                                            <button
                                                onClick={() => onFileSelect(item.fileData)}
                                                disabled={isProcessing}
                                                className="flex-1 text-left flex items-center gap-2 disabled:opacity-50 min-w-0"
                                            >
                                                <FileCode size={10} className="text-[#999999] group-hover:text-black shrink-0" />
                                                <span className="text-[10px] font-mono text-[#333333] group-hover:text-black truncate block">{item.label}</span>
                                            </button>
                                            
                                            {item.url && (
                                                <a 
                                                    href={item.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="opacity-0 group-hover:opacity-100 text-[#999999] hover:text-blue-600 transition-all shrink-0"
                                                    title="Read Original Paper"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="shrink-0 p-4 border-t border-[#E0E0E0] bg-[#F4F4F4]">
        <div className="text-[9px] text-[#999999] font-mono text-center">
            INDEX: {LIBRARY_DATA.reduce((acc, cat) => acc + cat.subcategories.reduce((sAcc, sub) => sAcc + sub.items.length, 0), 0)} ITEMS
        </div>
      </div>
    </div>
  );
};

export default LibraryPanel;