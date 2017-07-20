import { Ruleset, HandModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const SwapRuleset: Ruleset = {
  ...StandardRuleset,
  handModifier: HandModifier.SWAP,
};
