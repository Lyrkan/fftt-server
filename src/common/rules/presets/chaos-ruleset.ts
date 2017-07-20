import { Ruleset, PickModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const ChaosRuleset: Ruleset = {
  ...StandardRuleset,
  pickModifier: PickModifier.CHAOS,
};
