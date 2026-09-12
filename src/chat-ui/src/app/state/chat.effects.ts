import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { from, of } from 'rxjs';
import { catchError, exhaustMap, withLatestFrom } from 'rxjs/operators';
import { ChatActions } from './chat.actions';
import { chatFeature } from './chat.feature';
import { ChatService } from '../services/chat.service';

@Injectable()
export class ChatEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly chatService = inject(ChatService);

  sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.sendMessage),
      withLatestFrom(this.store.select(chatFeature.selectSessionId)),
      exhaustMap(([{ prompt }, sessionId]) =>
        from(this.runStream(prompt, sessionId)).pipe(
          catchError((error: unknown) =>
            of(
              ChatActions.streamFailed({
                error: error instanceof Error ? error.message : 'Stream failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  private async *runStream(prompt: string, sessionId: string | null) {
    let finalSessionId: string | null = sessionId;
    for await (const event of this.chatService.streamChat(prompt, sessionId)) {
      if (event.type === 'chunk') {
        yield ChatActions.streamChunkReceived({ chunk: event.chunk ?? '' });
      } else {
        finalSessionId = event.sessionId ?? finalSessionId;
      }
    }
    yield ChatActions.streamCompleted({ sessionId: finalSessionId });
  }
}
