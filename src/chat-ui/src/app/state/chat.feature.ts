import { createFeature, createReducer, on } from '@ngrx/store';
import { ChatActions } from './chat.actions';
import { initialChatState } from './chat.model';

export const chatFeature = createFeature({
  name: 'chat',
  reducer: createReducer(
    initialChatState,
    on(ChatActions.sendMessage, (state, { prompt }) => ({
      ...state,
      messages: [...state.messages, { id: crypto.randomUUID(), role: 'user' as const, text: prompt }],
      currentReply: '',
      isStreaming: true,
      error: null,
    })),
    on(ChatActions.streamChunkReceived, (state, { chunk }) => ({
      ...state,
      currentReply: state.currentReply + chunk,
    })),
    on(ChatActions.streamCompleted, (state, { sessionId }) => ({
      ...state,
      messages: state.currentReply
        ? [
            ...state.messages,
            { id: crypto.randomUUID(), role: 'assistant' as const, text: state.currentReply },
          ]
        : state.messages,
      currentReply: '',
      isStreaming: false,
      sessionId: sessionId ?? state.sessionId,
    })),
    on(ChatActions.streamFailed, (state, { error }) => ({
      ...state,
      isStreaming: false,
      error,
    })),
  ),
});
