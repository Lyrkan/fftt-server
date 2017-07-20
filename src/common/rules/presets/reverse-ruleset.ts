import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const ReverseRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.REVERSE],
};
