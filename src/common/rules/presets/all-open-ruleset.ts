import { Ruleset, VisibilityModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const AllOpenRuleset: Ruleset = {
  ...StandardRuleset,
  visibilityModifier: VisibilityModifier.ALL_OPEN,
};
