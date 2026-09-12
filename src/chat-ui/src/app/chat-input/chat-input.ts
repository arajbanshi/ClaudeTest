import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  imports: [ReactiveFormsModule],
  styleUrl: './chat-input.css',
  templateUrl: './chat-input.html',
})
export class ChatInput {
  readonly disabled = input<boolean>(false);
  readonly send = output<string>();

  readonly promptControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });

  private readonly syncDisabled = effect(() => {
    if (this.disabled()) {
      this.promptControl.disable();
    } else {
      this.promptControl.enable();
    }
  });

  submit(): void {
    if (this.promptControl.invalid || this.disabled()) {
      return;
    }
    const prompt = this.promptControl.value.trim();
    this.send.emit(prompt);
    this.promptControl.reset('');
  }
}
