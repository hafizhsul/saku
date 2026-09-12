import { describe, expect, it, vi } from "vitest"
import { lightColors, stateTokens } from "../../theme"
import { stateInteraction } from "./pressable"

vi.mock("react-native", () => ({
  useColorScheme: () => "light",
}))

describe("stateInteraction", () => {
  it("uses theme focus color for the ring", () => {
    expect(stateInteraction(lightColors).focusRing).toMatchObject({ borderColor: lightColors.focus })
  })
  it("unifies disabled opacity to the token", () => {
    expect(stateInteraction(lightColors).disabled).toMatchObject({ opacity: stateTokens.disabledOpacity })
    expect(stateTokens.disabledOpacity).toBe(0.55)
  })
})
