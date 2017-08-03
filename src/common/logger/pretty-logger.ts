import { Logger, LogLevel } from './logger';

const chalk = require('chalk');

const LOG_LEVEL_NAMES = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO] : 'INFO',
  [LogLevel.WARN] : 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const LOG_COLORS = {
  [LogLevel.TRACE]: '#9e9e9e',
  [LogLevel.DEBUG]: '#00bcd4',
  [LogLevel.INFO] : '#2196f3',
  [LogLevel.WARN] : '#ff5722',
  [LogLevel.ERROR]: '#e91e63',
};

export class PrettyLogger extends Logger {
  protected logTrace(category: string, message: string, ...args: any[]): void {
    // tslint:disable-next-line:no-console
    console.trace(this.formatMessage(LogLevel.TRACE, category, message), ...args);
  }

  protected logDebug(category: string, message: string, ...args: any[]): void {
    // tslint:disable-next-line:no-console
    console.log(this.formatMessage(LogLevel.DEBUG, category, message), ...args);
  }

  protected logInfo(category: string, message: string, ...args: any[]): void {
    // tslint:disable-next-line:no-console
    console.info(this.formatMessage(LogLevel.INFO, category, message), ...args);
  }

  protected logWarn(category: string, message: string, ...args: any[]): void {
    // tslint:disable-next-line:no-console
    console.warn(this.formatMessage(LogLevel.WARN, category, message), ...args);
  }

  protected logError(category: string, message: string, ...args: any[]): void {
    // tslint:disable-next-line:no-console
    console.error(this.formatMessage(LogLevel.ERROR, category, message), ...args);
  }

  private formatMessage(level: LogLevel, category: string, message: string) {
    const logDate = chalk.hex('#A4A4A4')((new Date().toISOString()));
    const logLevel =  chalk.hex(LOG_COLORS[level]).bold(`[${LOG_LEVEL_NAMES[level]}]`);
    const logContent = chalk.hex(LOG_COLORS[level])(`${category} - ${ message }`);

    return `${logDate} ${logLevel} ${logContent}`;
  }
}
