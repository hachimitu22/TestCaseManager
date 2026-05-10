import type { Testcase, TestcaseContent, TestcaseFormat, Testsuite, TestsuiteItem } from "./domain.js";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function unescapeXml(value: string): string {
  return value
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

function tag(name: string, value: string, indent: string): string {
  return `${indent}<${name}>${escapeXml(value)}</${name}>`;
}

function getTagValue(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? unescapeXml(match[1]) : "";
}

function getAttribute(xml: string, name: string): string {
  const match = xml.match(new RegExp(`${name}="([^"]*)"`));
  return match ? unescapeXml(match[1]) : "";
}

function contentToXml(testcase: Testcase, indent = "    "): string[] {
  if (testcase.format === "AAA") {
    const content = testcase.content as { arrange: string; act: string; assert: string };
    return [
      `${indent}<content>`,
      tag("arrange", content.arrange, `${indent}  `),
      tag("act", content.act, `${indent}  `),
      tag("assert", content.assert, `${indent}  `),
      `${indent}</content>`
    ];
  }

  if (testcase.format === "GWT") {
    const content = testcase.content as { given: string; when: string; then: string };
    return [
      `${indent}<content>`,
      tag("given", content.given, `${indent}  `),
      tag("when", content.when, `${indent}  `),
      tag("then", content.then, `${indent}  `),
      `${indent}</content>`
    ];
  }

  const content = testcase.content as { text: string };
  return [`${indent}<content>`, tag("text", content.text, `${indent}  `), `${indent}</content>`];
}

function itemsToXml(items: TestsuiteItem[]): string[] {
  if (items.length === 0) {
    return [];
  }

  return [
    "  <children>",
    ...items.map((item) => `    <${item.kind}-ref name="${escapeXml(item.name)}" />`),
    "  </children>"
  ];
}

function parseContent(format: TestcaseFormat, xml: string): TestcaseContent {
  if (format === "AAA") {
    return {
      arrange: getTagValue(xml, "arrange"),
      act: getTagValue(xml, "act"),
      assert: getTagValue(xml, "assert")
    };
  }

  if (format === "GWT") {
    return {
      given: getTagValue(xml, "given"),
      when: getTagValue(xml, "when"),
      then: getTagValue(xml, "then")
    };
  }

  return {
    text: getTagValue(xml, "text")
  };
}

export function testsuiteToXml(testsuite: Testsuite): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${escapeXml(testsuite.name)}">`
  ];

  lines.push(...itemsToXml(testsuite.items));

  lines.push("</testsuite>");
  return `${lines.join("\n")}\n`;
}

export function testsuiteFromXml(xml: string): Testsuite {
  const testsuite: Testsuite = {
    id: "",
    name: getAttribute(xml, "name"),
    items: [],
    testcases: []
  };

  const itemBlocks = xml.matchAll(/<(testsuite|testcase)-ref name="([^"]*)"\s*\/>/g);
  for (const match of itemBlocks) {
    testsuite.items.push({
      kind: match[1] as "testsuite" | "testcase",
      name: unescapeXml(match[2])
    });
  }

  return testsuite;
}

export function testcaseToXml(testcase: Testcase): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<testcase>",
    tag("title", testcase.title, "  "),
    tag("format", testcase.format, "  "),
    ...contentToXml(testcase, "  "),
    tag("notes", testcase.notes, "  "),
    "</testcase>"
  ];
  return `${lines.join("\n")}\n`;
}

export function testcaseFromXml(xml: string): Testcase {
  const format = getTagValue(xml, "format") as TestcaseFormat;
  return {
    id: "",
    title: getTagValue(xml, "title"),
    format,
    content: parseContent(format, xml),
    notes: getTagValue(xml, "notes")
  };
}
