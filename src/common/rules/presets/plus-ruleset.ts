import { Ruleset, CaptureModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const PlusRuleset: Ruleset = {
  ...StandardRuleset,
  captureModifiers: [CaptureModifier.PLUS],
};
