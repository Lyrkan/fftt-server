import { Ruleset, HandModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const RandomRuleset: Ruleset = {
  ...StandardRuleset,
  handModifier: HandModifier.RANDOM,
};
