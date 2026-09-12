import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface ChatStreamEvent {
  type: 'chunk' | 'done';
  chunk?: string;
  sessionId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly platformId = inject(PLATFORM_ID);

  async *streamChat(prompt: string, sessionId: string | null): AsyncGenerator<ChatStreamEvent> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const response = await fetch(`${environment.apiBaseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, session_id: sessionId }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let frameEnd: number;
      while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        yield* this.parseFrame(frame);
      }
    }
  }

  private *parseFrame(frame: string): Generator<ChatStreamEvent> {
    const lines = frame.split('\n');
    const isDone = lines.some((line) => line.startsWith('event: done'));
    const dataLine = lines.find((line) => line.startsWith('data: '));
    const data = dataLine ? dataLine.slice('data: '.length) : '';

    if (isDone) {
      try {
        const payload = JSON.parse(data || '{}');
        yield { type: 'done', sessionId: payload.session_id ?? null };
      } catch {
        yield { type: 'done', sessionId: null };
      }
    } else if (dataLine) {
      yield { type: 'chunk', chunk: data };
    }
  }
}
