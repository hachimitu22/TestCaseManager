export type TestcaseFormat = "AAA" | "GWT" | "TEXT";

export interface AaaContent {
  arrange: string;
  act: string;
  assert: string;
}

export interface GwtContent {
  given: string;
  when: string;
  then: string;
}

export interface TextContent {
  text: string;
}

export type TestcaseContent = AaaContent | GwtContent | TextContent;

export interface Testcase {
  id: string;
  title: string;
  format: TestcaseFormat;
  content: TestcaseContent;
  notes: string;
}

export type TestsuiteItemKind = "testsuite" | "testcase";

export interface TestsuiteItem {
  kind: TestsuiteItemKind;
  name: string;
}

export interface Testsuite {
  id: string;
  name: string;
  items: TestsuiteItem[];
  testcases: Testcase[];
}

export interface TcmConfig {
  version: 1;
  workspaceDir: string;
  storageDir: string;
  defaultSuiteName: string;
}

export const defaultConfig: TcmConfig = {
  version: 1,
  workspaceDir: ".",
  storageDir: "test-suites",
  defaultSuiteName: "Default Testsuite"
};

export function createEmptyTestsuite(id = "default", name = defaultConfig.defaultSuiteName): Testsuite {
  return {
    id,
    name,
    items: [],
    testcases: [],
  };
}
