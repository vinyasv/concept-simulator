export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

export interface SimulationData {
  code: string;
  explanation: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface FileData {
  name: string;
  type: string;
  data: string; // Base64
  category?: string;
  subcategory?: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  sources?: Source[];
  timestamp: Date;
}

export interface LibraryItem {
  id: string;
  label: string;
  fileData: FileData;
  cachedCode?: string; // Pre-generated React code
  url?: string;
}

export interface LibrarySubcategory {
  id: string;
  label: string;
  items: LibraryItem[];
}

export interface LibraryCategory {
  id: string;
  label: string;
  subcategories: LibrarySubcategory[];
}