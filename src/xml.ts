import type { Testcase, TestcaseContent, TestcaseFormat, Testsuite } from "./domain.js";

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

function contentToXml(testcase: Testcase): string[] {
  if (testcase.format === "AAA") {
    const content = testcase.content as { arrange: string; act: string; assert: string };
    return [
      "    <content>",
      tag("arrange", content.arrange, "      "),
      tag("act", content.act, "      "),
      tag("assert", content.assert, "      "),
      "    </content>"
    ];
  }

  if (testcase.format === "GWT") {
    const content = testcase.content as { given: string; when: string; then: string };
    return [
      "    <content>",
      tag("given", content.given, "      "),
      tag("when", content.when, "      "),
      tag("then", content.then, "      "),
      "    </content>"
    ];
  }

  const content = testcase.content as { text: string };
  return ["    <content>", tag("text", content.text, "      "), "    </content>"];
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
    `<testsuite id="${escapeXml(testsuite.id)}" name="${escapeXml(testsuite.name)}">`
  ];

  for (const testcase of testsuite.testcases) {
    lines.push(`  <testcase id="${escapeXml(testcase.id)}">`);
    lines.push(tag("title", testcase.title, "    "));
    lines.push(tag("format", testcase.format, "    "));
    lines.push(...contentToXml(testcase));
    lines.push(tag("notes", testcase.notes, "    "));
    lines.push("  </testcase>");
  }

  lines.push("</testsuite>");
  return `${lines.join("\n")}\n`;
}

export function testsuiteFromXml(xml: string): Testsuite {
  const testsuite: Testsuite = {
    id: getAttribute(xml, "id"),
    name: getAttribute(xml, "name"),
    testcases: []
  };

  const testcaseBlocks = xml.matchAll(/<testcase id="([^"]*)">([\s\S]*?)<\/testcase>/g);
  for (const match of testcaseBlocks) {
    const block = match[2];
    const format = getTagValue(block, "format") as TestcaseFormat;
    testsuite.testcases.push({
      id: unescapeXml(match[1]),
      title: getTagValue(block, "title"),
      format,
      content: parseContent(format, block),
      notes: getTagValue(block, "notes")
    });
  }

  return testsuite;
}
