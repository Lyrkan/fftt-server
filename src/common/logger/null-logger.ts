import { Logger } from './logger';

export class NullLogger extends Logger {
  protected logTrace(category: string, message: string, ...args: any[]): void {
    // Noop
  }

  protected logDebug(category: string, message: string, ...args: any[]): void {
    // Noop
  }

  protected logInfo(category: string, message: string, ...args: any[]): void {
    // Noop
  }

  protected logWarn(category: string, message: string, ...args: any[]): void {
    // Noop
  }

  protected logError(category: string, message: string, ...args: any[]): void {
    // Noop
  }
}
