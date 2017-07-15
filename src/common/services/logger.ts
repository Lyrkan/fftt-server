const chalk = require('chalk');

export enum LogLevel {
  TRACE = 'Trace',
  DEBUG = 'Debug',
  INFO = 'Info',
  WARN = 'Warn',
  ERROR = 'Error',
}

const LOG_COLORS = {
  [LogLevel.TRACE]: '#9e9e9e',
  [LogLevel.DEBUG]: '#00bcd4',
  [LogLevel.INFO]:  '#2196f3',
  [LogLevel.WARN]:  '#ff5722',
  [LogLevel.ERROR]: '#e91e63',
};

export class Logger {
  public constructor(private level: LogLevel = LogLevel.DEBUG) {
  }

  public trace(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.TRACE) {
      return;
    }

    console.trace.apply(this, [this.formatMessage(LogLevel.TRACE, category, message), ...args]);
  }

  public debug(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.DEBUG) {
      return;
    }

    console.log.apply(this, [this.formatMessage(LogLevel.DEBUG, category, message), ...args]);
  }

  public info(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.INFO) {
      return;
    }

    console.info.apply(this, [this.formatMessage(LogLevel.INFO, category, message), ...args]);
  }

  public warn(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.WARN) {
      return;
    }

    console.warn.apply(this, [this.formatMessage(LogLevel.WARN, category, message), ...args]);
  }

  public error(category: string, message: string, ...args: any[]): void {
    if (this.level > LogLevel.ERROR) {
      return;
    }

    console.error.apply(this, [this.formatMessage(LogLevel.ERROR, category, message), ...args]);
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  public setLevel(level: LogLevel) {
    this.level = level;
  }

  private formatMessage(level: LogLevel, category: string, message: string) {
    const logDate = chalk.hex('#A4A4A4')((new Date().toISOString()));
    const logLevel =  chalk.hex(LOG_COLORS[level]).bold(`[${level}]`);
    const logContent = chalk.hex(LOG_COLORS[level])(`${category} - ${ message }`);

    return `${logDate} ${logLevel} ${logContent}`;
  }
}
