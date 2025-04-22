import { AuthResponse, Document, ChatSession, ChatMessage, ApiError } from './types';

class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = 'http://localhost:5000/api';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {};
    
    // Only add Content-Type: application/json if we're not uploading files
    if (!options.body || !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add authorization if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const finalOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      credentials: 'include' as RequestCredentials,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = response.token;
    localStorage.setItem('token', response.token);
    return response;
  }

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.token = response.token;
    localStorage.setItem('token', response.token);
    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Document endpoints
  async getDocuments(): Promise<Document[]> {
    return this.request<Document[]>('/documents');
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`);
  }

  async uploadDocument(file: File): Promise<Document> {
    console.log("file", file);
    const formData = new FormData();
    formData.append('file', file);
    return this.request<Document>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async analyzeDocument(id: string, options?: {
    analysis_mode?: 'standard' | 'hypothetical' | 'hierarchical',
    analysis_level?: number,
    hypothetical_scenario?: any
  }): Promise<Document> {
    return this.request<Document>(`/documents/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Chat endpoints
  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/chat/sessions');
  }

  async createChatSession(): Promise<ChatSession> {
    return this.request<ChatSession>('/chat/sessions', {
      method: 'POST',
    });
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  }

  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    return this.request<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

export const api = new ApiClient(); 