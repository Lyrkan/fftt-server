import * as fs from 'fs';
import { Card, CardElement } from './card';
import { LoggerInterface } from '../logger/logger';

/**
 * The role of the CardsManager is to load
 * and make cards available to other components.
 */
export class CardsManager {
  private cards: Card[];

  /**
   * Constructor.
   *
   * @param logger An instance of the Logger service
   */
  public constructor(private logger: LoggerInterface) {
    this.cards = [];
  }

  /**
   * Load cards from a JSON file.
   *
   * @param path Path of the JSON file containing the cards.
   */
  public async load(path: string): Promise<void> {
    this.logger.info('CardsManager', `Loading cards from "${path}"`);

    const fileContent = await new Promise<string>((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          this.logger.error('CardsManager', `Could not load cards from "${path}": ${err.message}`);
          reject(err);
        }
        resolve(data);
      });
    });

    try {
      const parsedContent: Card[] = JSON.parse(fileContent);
      if (parsedContent) {
        // Check if each card is valid
        for (const card of parsedContent) {
          this.checkCardIntegrity(card);
        }

        // If all cards are valid keep them
        this.logger.debug('CardsManager', `${parsedContent.length} cards loaded`);
        this.cards = parsedContent;
      } else {
        this.logger.warn('CardsManager', 'No card was found, is the file empty?');
      }
    } catch (e) {
      this.logger.error('CardsManager', `Could not load cards from "${path}": ${e.message}`);
      throw e;
    }
  }

  /**
   * Return a copy of the cards array.
   */
  public getCards(): Card[] {
    return [...this.cards];
  }

  /**
   * Return cards mapped by their ID.
   */
  public getCardsMap(): Map<string, Card> {
    return new Map<string, Card>(
      this.cards.map(c => [c.id, c] as [string, Card])
    );
  }

  /**
   * Check if all the values of a card are okay.
   * This is called for each card loaded by the manager to
   * ensure that the JSON file didn't contain any invalid
   * data.
   *
   * @param card A card
   */
  private checkCardIntegrity(card: Card) {
    if (!card.id) {
      throw new Error(`Card has no ID: ${JSON.stringify(card)}`);
    }

    if (!card.values) {
      throw new Error(`Card "${card.id}" has no value at all`);
    }

    for (const side of ['top', 'left', 'right', 'bottom']) {
      const sideValue = ((card.values as any) as {[key: string]: number})[side];
      if (!sideValue) {
        throw new Error(`Card "${card.id}" has not value for its ${side} side`);
      }

      if (sideValue < 1 || sideValue > 10) {
        // tslint:disable-next-line:max-line-length
        throw new Error(`Card "${card.id}" has an invalid value for its ${side} side: ${sideValue}`);
      }

      const availableElements = Object.keys(CardElement).map(key => (CardElement as any)[key]);
      if (card.element && (availableElements.indexOf(card.element) === -1)) {
        throw new Error(`Card "${card.id}" has an invalid element value: "${card.element}"`);
      }
    }
  }
}
