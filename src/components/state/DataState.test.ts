import { describe, expect, it, vi } from "vitest"
import { resolveDataState } from "./DataState"

vi.mock("react-native", () => ({
  Pressable: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
  Text: () => null,
  View: () => null,
  useColorScheme: () => "light",
}))

vi.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
  default: () => null,
}))

describe("resolveDataState", () => {
  it("loading beats error and empty", () => {
    expect(resolveDataState({ loading: true, error: "x", isEmpty: true })).toBe("loading")
  })
  it("error beats empty", () => {
    expect(resolveDataState({ loading: false, error: "x", isEmpty: true })).toBe("error")
  })
  it("empty beats children", () => {
    expect(resolveDataState({ loading: false, error: null, isEmpty: true })).toBe("empty")
  })
  it("success otherwise", () => {
    expect(resolveDataState({ loading: false, error: null, isEmpty: false })).toBe("success")
  })
})
