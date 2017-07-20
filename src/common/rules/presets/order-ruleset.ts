import { Ruleset, PickModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const OrderRuleset: Ruleset = {
  ...StandardRuleset,
  pickModifier: PickModifier.ORDER,
};
