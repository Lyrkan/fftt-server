import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const ComboPlusRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.PLUS, CaptureModifier.COMBO],
};
