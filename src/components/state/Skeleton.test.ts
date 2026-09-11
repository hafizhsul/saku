import { describe, expect, it, vi } from "vitest"
import { skeletonShimmer } from "./Skeleton"

vi.mock("react-native", () => ({
  AccessibilityInfo: { isReduceMotionEnabled: async () => false },
  Animated: {
    Value: class {
      interpolate() { return 0 }
    },
    loop: () => ({ start() { }, stop() { } }),
    sequence: () => ({}),
    timing: () => ({}),
  },
  StyleSheet: { create: (styles: unknown) => styles },
  View: () => null,
  useColorScheme: () => "light",
}))

describe("skeletonShimmer", () => {
  it("returns static opacity when reduced motion is on", () => {
    expect(skeletonShimmer(true)).toEqual({ from: 1, to: 1, duration: 0 })
  })
  it("returns 900ms loop config otherwise", () => {
    expect(skeletonShimmer(false)).toEqual({ from: 0.45, to: 1, duration: 900 })
  })
})
