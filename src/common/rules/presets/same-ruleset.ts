import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const SameRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.SAME],
};
