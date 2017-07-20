export interface Ruleset {
  boardWidth: number;
  boardHeight: number;
  handSize: number;
  handModifier: HandModifier|null;
  borderModifier: BorderModifier|null;
  visibilityModifier: VisibilityModifier|null;
  pickModifier: PickModifier|null;
  captureModifiers: CaptureModifier[];
}

export enum HandModifier {
  RANDOM = 'Random',
  SWAP   = 'Swap',
}

export enum PickModifier {
  CHAOS = 'Chaos',
  ORDER = 'Order',
}

export enum VisibilityModifier {
  ALL_OPEN   = 'AllOpen',
  THREE_OPEN = 'ThreeOpen',
}

export enum BorderModifier {
  WRAP = 'Wrap',
}

export enum CaptureModifier {
  REVERSE    = 'Reverse',
  FALLEN_ACE = 'FallenAce',
  SAME       = 'Same',
  PLUS       = 'Plus',
  COMBO      = 'Combo',
}
