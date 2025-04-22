export interface User {
  _id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Document {
  _id: string;
  title: string;
  content: string;
  user_id: string;
  file_path: string;
  created_at: string;
  analysis?: DocumentAnalysis;
}

export interface DocumentAnalysis {
  summary: string;
  key_points: string[];
  recommendations: string[];
  created_at: string;
}

export interface ChatSession {
  _id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  _id: string;
  session_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface ApiError {
  message: string;
} 