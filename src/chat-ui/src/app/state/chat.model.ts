export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatState {
  messages: ChatMessage[];
  currentReply: string;
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
}


export const initialChatState: ChatState = {
  messages: [],
  currentReply: '',
  isStreaming: false,
  error: null,
  sessionId: null,
};
