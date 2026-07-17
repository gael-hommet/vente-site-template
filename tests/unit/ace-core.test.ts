import { describe, expect, it } from "vitest";
import { createRegistry } from "@/ace/core";
import { ACE_MODULES, ACE_VERSION } from "@/ace/core";

describe("ace-core registry", () => {
  it("registers, lists and retrieves entries by id", () => {
    const reg = createRegistry("test", [
      { id: "a", label: 1 },
      { id: "b", label: 2 },
    ]);
    expect(reg.ids()).toEqual(["a", "b"]);
    expect(reg.get("b").label).toBe(2);
    expect(reg.has("a")).toBe(true);
    expect(reg.has("z")).toBe(false);
  });

  it("throws on duplicate ids (programming error, fail fast)", () => {
    expect(() => createRegistry("test", [{ id: "x" }, { id: "x" }])).toThrow(/duplicate id "x"/);
  });

  it("throws with the known ids when asked for an unknown id", () => {
    const reg = createRegistry("test", [{ id: "known" }]);
    expect(() => reg.get("missing")).toThrow(/unknown id "missing".*known/);
  });

  it("exposes the engine identity", () => {
    expect(ACE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Object.keys(ACE_MODULES).length).toBeGreaterThanOrEqual(11);
  });
});
