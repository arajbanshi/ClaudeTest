import { createActionGroup, props } from '@ngrx/store';

export const ChatActions = createActionGroup({
  source: 'Chat',
  events: {
    'Send Message': props<{ prompt: string }>(),
    'Stream Chunk Received': props<{ chunk: string }>(),
    'Stream Completed': props<{ sessionId: string | null }>(),
    'Stream Failed': props<{ error: string }>(),
  },
});
