import { describe, expect, it } from "vitest";

import { defaultDeviceLabelForPlatform, normalizeDeviceLabelForPlatform } from "../lib/trusted-device-state";

describe("trusted device helpers", () => {
  it("uses readable local labels and bounds user-provided device names", () => {
    expect(defaultDeviceLabelForPlatform("android")).toBe("This Android device");
    expect(normalizeDeviceLabelForPlatform("  Research   phone  ", "android")).toBe("Research phone");
    expect(normalizeDeviceLabelForPlatform(" ", "android")).toContain("This");
    expect(normalizeDeviceLabelForPlatform("a".repeat(140), "android")).toHaveLength(120);
  });
});
