import { Ruleset, VisibilityModifier } from '../ruleset';
import { StandardRuleset } from './standard-ruleset';

export const ThreeOpenRuleset: Ruleset = {
  ...StandardRuleset,
  visibilityModifier: VisibilityModifier.THREE_OPEN,
};
