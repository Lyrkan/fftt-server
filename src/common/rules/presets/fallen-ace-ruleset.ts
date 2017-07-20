import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const FallenAceRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.FALLEN_ACE],
};
