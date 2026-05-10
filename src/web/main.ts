import "./style.css";

type TestcaseFormat = "AAA" | "GWT" | "TEXT";

type Testcase = {
  id: string;
  title: string;
  format: TestcaseFormat;
  content: Record<string, string>;
  notes: string;
};

type TestsuiteItem = {
  kind: "testsuite" | "testcase";
  name: string;
};

type Testsuite = {
  id: string;
  name: string;
  items: TestsuiteItem[];
  testcases: Testcase[];
};

const state: { suite: Testsuite } = {
  suite: { id: "", name: "Default Testsuite", items: [], testcases: [] }
};

const suiteList = document.querySelector<HTMLDivElement>("#suite-list")!;
const suiteName = document.querySelector<HTMLInputElement>("#suite-name")!;
const deleteSuiteButton = document.querySelector<HTMLButtonElement>("#delete-suite")!;
const childSuiteList = document.querySelector<HTMLDivElement>("#child-suite-list")!;
const caseTitle = document.querySelector<HTMLInputElement>("#case-title")!;
const caseFormat = document.querySelector<HTMLSelectElement>("#case-format")!;
const formatFields = document.querySelector<HTMLDivElement>("#format-fields")!;
const caseNotes = document.querySelector<HTMLTextAreaElement>("#case-notes")!;
const caseList = document.querySelector<HTMLDivElement>("#case-list")!;

function idFromName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "default";
}

function suiteUrl(id: string): string {
  return id ? `/api/test-suites/${encodeURIComponent(id)}` : "/api/root-testsuite";
}

function childrenUrl(id: string): string {
  return id ? `/api/test-suites/${encodeURIComponent(id)}/children` : "/api/root-testsuite/children";
}

function joinId(parentId: string, name: string): string {
  return [parentId, idFromName(name)].filter(Boolean).join("/");
}

function renderFormatFields(): void {
  const format = caseFormat.value as TestcaseFormat;
  const fields = format === "AAA"
    ? ["arrange", "act", "assert"]
    : format === "GWT"
      ? ["given", "when", "then"]
      : ["text"];

  formatFields.replaceChildren(...fields.map((field) => {
    const textarea = document.createElement("textarea");
    textarea.dataset.field = field;
    textarea.placeholder = field;
    textarea.rows = field === "text" ? 6 : 3;
    return textarea;
  }));
}

function renderSuite(): void {
  suiteName.value = state.suite.name;
  deleteSuiteButton.disabled = state.suite.id === "";
  childSuiteList.replaceChildren(...state.suite.items.filter((item) => item.kind === "testsuite").map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.name;
    button.addEventListener("click", () => loadSuite(joinId(state.suite.id, item.name)));
    return button;
  }));
  caseList.replaceChildren(...state.suite.testcases.map((testcase) => {
    const article = document.createElement("article");
    article.className = "testcase-card";
    const title = document.createElement("h2");
    title.textContent = testcase.title || "(untitled testcase)";
    const format = document.createElement("span");
    format.textContent = testcase.format === "GWT" ? "Given-When-Then" : testcase.format;
    const content = document.createElement("pre");
    content.textContent = Object.entries(testcase.content)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    const notes = document.createElement("p");
    notes.textContent = testcase.notes;
    article.append(title, format, content, notes);
    return article;
  }));
}

async function loadSuites(): Promise<void> {
  const response = await fetch("/api/test-suites");
  const suites = await response.json() as Array<{ id: string; name: string }>;
  suiteList.replaceChildren(...suites.map((suite) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = suite.name;
    button.addEventListener("click", () => loadSuite(suite.id));
    return button;
  }));
}

async function loadSuite(id: string): Promise<void> {
  const response = await fetch(suiteUrl(id));
  state.suite = await response.json() as Testsuite;
  state.suite.items ??= [];
  state.suite.testcases ??= [];
  renderSuite();
}

async function saveSuite(): Promise<void> {
  state.suite.name = suiteName.value.trim() || "Default Testsuite";
  const response = await fetch(suiteUrl(state.suite.id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.suite)
  });
  state.suite = await response.json() as Testsuite;
  await loadSuites();
  renderSuite();
}

document.querySelector<HTMLButtonElement>("#new-suite")!.addEventListener("click", () => {
  state.suite = { id: `suite-${Date.now()}`, name: "New Testsuite", items: [], testcases: [] };
  renderSuite();
});

document.querySelector<HTMLButtonElement>("#save-suite")!.addEventListener("click", () => {
  void saveSuite();
});

document.querySelector<HTMLButtonElement>("#add-child-suite")!.addEventListener("click", async () => {
  const name = `suite-${Date.now()}`;
  const response = await fetch(childrenUrl(state.suite.id), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  const child = await response.json() as Testsuite;
  await loadSuite(state.suite.id);
  await loadSuites();
  await loadSuite(child.id);
});

deleteSuiteButton.addEventListener("click", async () => {
  if (!confirm(`Delete "${state.suite.name}" and all child testsuites?`)) {
    return;
  }

  await fetch(suiteUrl(state.suite.id), { method: "DELETE" });
  await loadSuites();
  await loadSuite("");
});

document.querySelector<HTMLButtonElement>("#add-case")!.addEventListener("click", () => {
  const content: Record<string, string> = {};
  for (const input of Array.from(formatFields.querySelectorAll<HTMLTextAreaElement>("textarea"))) {
    content[input.dataset.field!] = input.value;
  }

  const name = idFromName(caseTitle.value || `testcase-${Date.now()}`);
  state.suite.testcases.push({
    id: joinId(state.suite.id, name),
    title: caseTitle.value,
    format: caseFormat.value as TestcaseFormat,
    content,
    notes: caseNotes.value
  });

  caseTitle.value = "";
  caseNotes.value = "";
  renderFormatFields();
  renderSuite();
});

caseFormat.addEventListener("change", renderFormatFields);

renderFormatFields();
void loadSuites().then(() => loadSuite(""));
