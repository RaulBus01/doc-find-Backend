export class ChatNotFoundException extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ChatNotFoundException';
    }
  }
  