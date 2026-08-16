import { describe, expect, it } from "vitest";

import { isSyncProgressActive, syncProgress } from "../lib/sync-progress";

describe("sync progress", () => {
  it("exposes staged, accessible progress information through the encryption pipeline", () => {
    expect(syncProgress("authorizing")).toMatchObject({ stage: "authorizing", percent: 8, label: "Waiting for device confirmation" });
    expect(syncProgress("encrypting")).toMatchObject({ stage: "encrypting", percent: 48, label: "Encrypting graph on this device" });
    expect(syncProgress("uploading")).toMatchObject({ stage: "uploading", percent: 72, label: "Uploading encrypted envelope" });
    expect(syncProgress("complete")).toMatchObject({ stage: "complete", percent: 100 });
  });

  it("identifies only in-flight stages as blocking and retains a caller-provided recovery message", () => {
    expect(isSyncProgressActive(syncProgress("fetching"))).toBe(true);
    expect(isSyncProgressActive(syncProgress("review"))).toBe(false);
    expect(isSyncProgressActive(syncProgress("error", "Incorrect passphrase — try again"))).toBe(false);
    expect(syncProgress("error", "Incorrect passphrase — try again").label).toBe("Incorrect passphrase — try again");
  });
});
