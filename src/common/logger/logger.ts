export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO  = 2,
  WARN  = 3,
  ERROR = 4,
}

export abstract class Logger implements LoggerInterface {
  /**
   * Constructor.
   *
   * @param level Initial log level
   */
  public constructor(protected level: LogLevel = LogLevel.DEBUG) {
  }

  /**
   * @inheritdoc
   */
  public trace(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.TRACE) {
      return;
    }

    this.logTrace(category, message, ...args);
  }

  /**
   * @inheritdoc
   */
  public debug(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.DEBUG) {
      return;
    }

    this.logDebug(category, message, ...args);
  }

  /**
   * @inheritdoc
   */
  public info(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.INFO) {
      return;
    }

    this.logInfo(category, message, ...args);
  }

  /**
   * @inheritdoc
   */
  public warn(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.WARN) {
      return;
    }

    this.logWarn(category, message, ...args);
  }

  /**
   * @inheritdoc
   */
  public error(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.ERROR) {
      return;
    }

    this.logError(category, message, ...args);
  }

  /**
   * @inheritdoc
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * @inheritdoc
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

export interface LoggerInterface {
  /**
   * Log a "trace" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  trace(category: string, message: string, ...args: any[]): void;

  /**
   * Log a "debug" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  debug(category: string, message: string, ...args: any[]): void;

  /**
   * Log an "info" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  info(category: string, message: string, ...args: any[]): void;

  /**
   * Log a "warn" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  warn(category: string, message: string, ...args: any[]): void;

  /**
   * Log an "error" message if the current log level allows it.
   *
   * @param category Message category
   * @param message  Message
   * @param args     Additional data related to the message
   */
  error(category: string, message: string, ...args: any[]): void;

  /**
   * Return the current log level.
   */
  getLevel(): LogLevel;

  /**
   * Set a new log level.
   *
   * @param level New log level
   */
  setLevel(level: LogLevel): this;
}
