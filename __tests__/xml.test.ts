import { describe, expect, it } from "vitest";
import type { Testsuite } from "../src/domain.js";
import { testsuiteFromXml, testsuiteToXml } from "../src/xml.js";

describe("testsuite XML", () => {
  it("serializes and parses supported testcase formats", () => {
    const testsuite: Testsuite = {
      id: "login",
      name: "Login",
      testcases: [
        {
          id: "aaa",
          title: "AAA case",
          format: "AAA",
          content: { arrange: "user exists", act: "login", assert: "dashboard opens" },
          notes: "reason"
        },
        {
          id: "gwt",
          title: "GWT case",
          format: "GWT",
          content: { given: "user exists", when: "login", then: "dashboard opens" },
          notes: "table"
        },
        {
          id: "text",
          title: "Text case",
          format: "TEXT",
          content: { text: "free text" },
          notes: "process"
        }
      ]
    };

    expect(testsuiteFromXml(testsuiteToXml(testsuite))).toEqual(testsuite);
  });
});
