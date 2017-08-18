import { LoggerInterface, LogLevel } from '../../common/logger/logger';

/**
 * Decorator for the logger in order to add node
 * info.
 */
export class LoggerDecorator implements LoggerInterface {
  /**
   * Constructor.
   *
   * @param inner  Real logger
   * @param nodeId Node Identifier
   */
  constructor(
    private inner: LoggerInterface,
    private decorateCategory: (category: string) => string = category => category,
    private decorateMessage: (message: string) => string = message => message,
  ) {
  }

  /**
   * @inheritdoc
   */
  public trace(category: string, message: string, ...args: any[]): void {
    this.inner.trace(
      this.decorateCategory(category),
      this.decorateMessage(message),
      ...args
    );
  }

  /**
   * @inheritdoc
   */
  public debug(category: string, message: string, ...args: any[]): void {
    this.inner.debug(
      this.decorateCategory(category),
      this.decorateMessage(message),
      ...args
    );
  }

  /**
   * @inheritdoc
   */
  public info(category: string, message: string, ...args: any[]): void {
    this.inner.info(
      this.decorateCategory(category),
      this.decorateMessage(message),
      ...args
    );
  }

  /**
   * @inheritdoc
   */
  public warn(category: string, message: string, ...args: any[]): void {
    this.inner.warn(
      this.decorateCategory(category),
      this.decorateMessage(message),
      ...args
    );
  }

  /**
   * @inheritdoc
   */
  public error(category: string, message: string, ...args: any[]): void {
    this.inner.error(
      this.decorateCategory(category),
      this.decorateMessage(message),
      ...args
    );
  }

  /**
   * @inheritdoc
   */
  public getLevel(): LogLevel {
    return this.inner.getLevel();
  }

  /**
   * @inheritdoc
   */
  public setLevel(level: LogLevel): this {
    this.inner.setLevel(level);
    return this;
  }
}
