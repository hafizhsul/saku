import type { ThemeColors } from "../../theme"
import { stateTokens } from "../../theme"

// One interaction language for every Pressable: pressed opacity + scale,
// hovered surfaceMuted, visible focus ring (no layout shift: border only).
export function stateInteraction(colors: ThemeColors) {
  return {
    pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
    hovered: { backgroundColor: colors.surfaceMuted },
    focusRing: { borderColor: colors.focus, borderWidth: stateTokens.focusWidth },
    disabled: { opacity: stateTokens.disabledOpacity },
  } as const
}
