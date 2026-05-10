import { describe, expect, it } from "vitest";
import type { Testcase, Testsuite } from "../src/domain.js";
import { testcaseFromXml, testcaseToXml, testsuiteFromXml, testsuiteToXml } from "../src/xml.js";

describe("XML", () => {
  it("serializes and parses testsuite items in order", () => {
    const testsuite: Testsuite = {
      id: "login",
      name: "Login",
      items: [
        { kind: "testsuite", name: "normal-cases" },
        { kind: "testcase", name: "valid-login" },
        { kind: "testsuite", name: "edge-cases" }
      ],
      testcases: []
    };

    expect(testsuiteFromXml(testsuiteToXml(testsuite))).toEqual({
      ...testsuite,
      id: ""
    });
  });

  it("serializes and parses testcase XML", () => {
    const testcase: Testcase = {
      id: "login/valid-login",
      title: "Valid login",
      format: "AAA",
      content: { arrange: "user exists", act: "login", assert: "dashboard opens" },
      notes: "reason"
    };

    expect(testcaseFromXml(testcaseToXml(testcase))).toEqual({
      ...testcase,
      id: ""
    });
  });
});
