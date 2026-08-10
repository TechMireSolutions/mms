import { describe, expect, it } from "vitest";
import type { FieldConfig } from "@mms/shared";
import { syncOptionsInConfig } from "@/lib/contacts/preferencesStorage";

function makeFieldConfig(): FieldConfig {
  return {
    version: 1,
    enabledTabs: ["details", "custom"],
    requiredTabs: [],
    fields: {
      details: [
        { key: "phone", label: "Phone", type: "text", enabled: true, order: 1, options: ["home", "work"] },
        { key: "email", label: "Email", type: "email", enabled: true, order: 2, options: ["personal", "work"] },
      ],
      custom: [{ key: "nickname", label: "Nickname", type: "text", enabled: true, order: 1, options: [] }],
    },
  };
}

describe("syncOptionsInConfig", () => {
  it("replaces options on the matching field in the given tab", () => {
    const config = makeFieldConfig();
    const next = syncOptionsInConfig(config, "details", "phone", ["mobile", "office"]);

    expect(next.fields.details[0].options).toEqual(["mobile", "office"]);
    expect(next.fields.details[1].options).toEqual(["personal", "work"]);
    expect(next.fields.custom).toEqual(config.fields.custom);
  });

  it("returns a new config instance while sharing untouched tab arrays", () => {
    const config = makeFieldConfig();
    const next = syncOptionsInConfig(config, "details", "phone", ["mobile"]);

    expect(next).not.toBe(config);
    expect(next.fields.custom).toBe(config.fields.custom);
  });

  it("leaves the config unchanged when the tab is absent", () => {
    const config = makeFieldConfig();
    const next = syncOptionsInConfig(config, "missingTab", "phone", ["mobile"]);

    expect(next).toEqual(config);
  });

  it("leaves the config unchanged when the field key is not in the tab", () => {
    const config = makeFieldConfig();
    const next = syncOptionsInConfig(config, "details", "missingField", ["mobile"]);

    expect(next).toEqual(config);
  });

  it("does not mutate the original config", () => {
    const config = makeFieldConfig();
    syncOptionsInConfig(config, "details", "phone", ["mobile"]);

    expect(config.fields.details[0].options).toEqual(["home", "work"]);
  });
});
