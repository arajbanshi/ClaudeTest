import {
  AfterViewChecked,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatMessage } from '../state/chat.model';

@Component({
  selector: 'app-chat-message-list',
  styleUrl: './chat-message-list.css',
  templateUrl: './chat-message-list.html',
})
export class ChatMessageList implements AfterViewChecked {
  readonly messages = input<ChatMessage[]>([]);
  readonly currentReply = input<string>('');
  readonly isStreaming = input<boolean>(false);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId) || !this.scrollContainer) {
      return;
    }
    const el = this.scrollContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
