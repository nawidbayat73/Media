import colors from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';

/**
 * Returns the design tokens for the active color scheme, resolved from the
 * user's manual theme choice (system / light / dark) in SettingsContext.
 */
export function useColors() {
  const { resolvedScheme } = useSettings();
  const palette = resolvedScheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
