import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { chatFeature } from './state/chat.feature';
import { ChatActions } from './state/chat.actions';
import { ChatMessageList } from './chat-message-list/chat-message-list';
import { ChatInput } from './chat-input/chat-input';

@Component({
  imports: [ChatMessageList, ChatInput],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly store = inject(Store);

  protected readonly messages = this.store.selectSignal(chatFeature.selectMessages);
  protected readonly currentReply = this.store.selectSignal(chatFeature.selectCurrentReply);
  protected readonly isStreaming = this.store.selectSignal(chatFeature.selectIsStreaming);
  protected readonly error = this.store.selectSignal(chatFeature.selectError);

  protected onSend(prompt: string): void {
    this.store.dispatch(ChatActions.sendMessage({ prompt }));
  }
}
