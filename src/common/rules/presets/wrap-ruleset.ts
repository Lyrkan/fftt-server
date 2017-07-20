import { Ruleset, BorderModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const WrapRuleset: Ruleset = {
  ...StandardRuleset,
  borderModifier: BorderModifier.WRAP,
};
