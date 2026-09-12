import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { App } from './app';
import { chatFeature } from './state/chat.feature';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideStore({ [chatFeature.name]: chatFeature.reducer })],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the chat input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-chat-input')).toBeTruthy();
  });
});
