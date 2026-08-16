export function defaultDeviceLabelForPlatform(platform: string) { return platform === "ios" ? "This iPhone or iPad" : platform === "android" ? "This Android device" : "This web browser"; }
export function normalizeDeviceLabelForPlatform(value: string, platform: string) { return value.trim().replace(/\s+/g, " ").slice(0, 120) || defaultDeviceLabelForPlatform(platform); }
