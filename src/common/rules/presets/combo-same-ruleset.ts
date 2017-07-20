import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const ComboSameRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.SAME, CaptureModifier.COMBO],
};
