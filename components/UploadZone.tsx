import React, { useCallback, useState } from 'react';
import { Upload, Folder, File, AlertCircle, ArrowRight } from 'lucide-react';
import { FileData } from '../types';
import { SAMPLE_FILES } from '../constants';

interface UploadZoneProps {
  onFileSelect: (file: FileData) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file) return;

    // Basic validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError("Format Unsupported.");
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Drop Zone */}
      <div 
        className={`
          relative flex-1 flex flex-col items-center justify-center p-6 border transition-all duration-0
          ${isDragging 
            ? 'border-black bg-[#EFEFEF]' 
            : 'border-[#E0E0E0] hover:border-black bg-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          disabled={isProcessing}
          accept=".jpg,.jpeg,.png,.webp,.pdf"
        />
        
        <div className="flex flex-col items-center gap-4 text-center pointer-events-none z-10">
          <Upload size={24} className="text-black" strokeWidth={1.5} />
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-black uppercase tracking-wide">
              Data Ingestion
            </p>
            <p className="text-[10px] text-[#757575] font-mono">
              [PDF / IMG / TXT]
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-black text-xs mt-2 bg-[#E0E0E0] px-3 py-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Samples - List View */}
      <div className="space-y-2 z-30 relative">
        <div className="flex items-center gap-2 text-[10px] text-[#757575] uppercase tracking-widest font-bold border-b border-[#E0E0E0] pb-1">
           <Folder size={12} />
           <span>Reference_Samples</span>
        </div>
        <div className="flex flex-col">
          {SAMPLE_FILES.map((sample) => (
            <button
              key={sample.name}
              onClick={() => onFileSelect(sample)}
              disabled={isProcessing}
              className="group flex items-center justify-between px-2 py-3 border-b border-[#F0F0F0] hover:bg-white hover:border-[#E0E0E0] transition-all text-left disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                 <File size={14} className="text-black" />
                 <span className="text-xs text-black font-medium group-hover:underline decoration-1 underline-offset-2">{sample.label}</span>
              </div>
              <ArrowRight size={12} className="text-[#999999] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadZone;