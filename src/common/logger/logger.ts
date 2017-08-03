export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO  = 2,
  WARN  = 3,
  ERROR = 4,
}

export abstract class Logger {
  /**
   * Constructor.
   *
   * @param level Initial log level
   */
  public constructor(protected level: LogLevel = LogLevel.DEBUG) {
  }

  /**
   * Log a "trace" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  public trace(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.TRACE) {
      return;
    }

    this.logTrace(category, message, ...args);
  }

  /**
   * Log a "debug" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  public debug(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.DEBUG) {
      return;
    }

    this.logDebug(category, message, ...args);
  }

  /**
   * Log an "info" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  public info(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.INFO) {
      return;
    }

    this.logInfo(category, message, ...args);
  }

  /**
   * Log a "warn" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  public warn(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.WARN) {
      return;
    }

    this.logWarn(category, message, ...args);
  }

  /**
   * Log an "error" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  public error(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.ERROR) {
      return;
    }

    this.logError(category, message, ...args);
  }

  /**
   * Return the current log level.
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Set a new log level.
   *
   * @param level New log level
   */
  public setLevel(level: LogLevel): this {
    this.level = level;
    return this;
  }

  protected abstract logTrace(category: string, message: string, ...args: any[]): void;
  protected abstract logDebug(category: string, message: string, ...args: any[]): void;
  protected abstract logInfo(category: string, message: string, ...args: any[]): void;
  protected abstract logWarn(category: string, message: string, ...args: any[]): void;
  protected abstract logError(category: string, message: string, ...args: any[]): void;
}
