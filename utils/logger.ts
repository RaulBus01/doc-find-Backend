import { LogLevel } from "../types/types.ts";

export class Logger {
    private context: string;
  
    constructor(context: string) {
      this.context = context;
    }
  
    private log(level: LogLevel, message: string, metadata?: unknown): void {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        message,
        metadata: metadata || {},
      }));
    }
  
    debug(message: string, metadata?: unknown): void {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  
    info(message: string, metadata?: unknown): void {
      this.log(LogLevel.INFO, message, metadata);
    }
  
    warn(message: string, metadata?: unknown): void {
      this.log(LogLevel.WARN, message, metadata);
    }
  
    error(message: string, error?: Error, metadata?: unknown): void {
      this.log(LogLevel.ERROR, message, {
        error: error?.message,
        stack: error?.stack,
        metadata,
    
      });
    }
  }