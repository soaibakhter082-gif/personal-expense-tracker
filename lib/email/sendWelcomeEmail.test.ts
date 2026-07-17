import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { afterEach } from "node:test";
import ts from "typescript";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const originalFetch = globalThis.fetch;
const originalApiKey = process.env.BREVO_API_KEY;
const originalSenderEmail = process.env.BREVO_SENDER_EMAIL;

type FetchCall = {
  input: string | URL | Request;
  init?: RequestInit;
};

function loadSourceWithoutServerOnly() {
  const source = readFileSync(
    new URL("./sendWelcomeEmail.ts", import.meta.url),
    "utf8",
  ).replace(/^import "server-only";\r?\n/, "");

  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

async function loadSendWelcomeEmail() {
  const javascript = loadSourceWithoutServerOnly();
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Date.now()}-${Math.random()}`;
  const loadedModule = (await import(dataUrl)) as {
    sendWelcomeEmail: (recipientEmail: string) => Promise<{ sent: boolean }>;
  };

  return loadedModule.sendWelcomeEmail;
}

function setBrevoConfig() {
  process.env.BREVO_API_KEY = "test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";
}

function clearBrevoConfig() {
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_SENDER_EMAIL;
}

function mockFetch(response: Response | Error) {
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ input, init });

    if (response instanceof Error) {
      throw response;
    }

    return response;
  }) as typeof fetch;

  return calls;
}

function getRequestBody(call: FetchCall) {
  const body = call.init?.body;

  if (typeof body !== "string") {
    throw new TypeError("Expected request body to be a string.");
  }

  return JSON.parse(body);
}

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalApiKey === undefined) {
    delete process.env.BREVO_API_KEY;
  } else {
    process.env.BREVO_API_KEY = originalApiKey;
  }

  if (originalSenderEmail === undefined) {
    delete process.env.BREVO_SENDER_EMAIL;
  } else {
    process.env.BREVO_SENDER_EMAIL = originalSenderEmail;
  }
});

test("successful Brevo response sends the welcome email request", async () => {
  setBrevoConfig();
  const calls = mockFetch(new Response("{}", { status: 201, statusText: "Created" }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.com");

  assert.deepEqual(result, { sent: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.input, brevoEndpoint);
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(calls[0]?.init?.headers, {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": "test-api-key",
  });

  const body = getRequestBody(calls[0]);

  assert.deepEqual(body.sender, {
    name: "Personal Expense Tracker",
    email: "sender@example.com",
  });
  assert.deepEqual(body.to, [{ email: "new-user@example.com" }]);
  assert.equal(
    body.subject,
    "Your Personal Expense Tracker account was created",
  );
  assert.match(body.textContent, /account has been created successfully/i);
  assert.match(body.htmlContent, /Account created successfully/);
  assert.doesNotMatch(JSON.stringify(body), /confirm|token|password|access_token|refresh_token/i);
});

test("missing Brevo configuration returns false without calling fetch", async () => {
  clearBrevoConfig();
  const calls = mockFetch(new Response("{}", { status: 201 }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.com");

  assert.deepEqual(result, { sent: false });
  assert.equal(calls.length, 0);
});

test("failed Brevo response returns false", async () => {
  setBrevoConfig();
  const calls = mockFetch(new Response("{}", { status: 401, statusText: "Unauthorized" }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.com");

  assert.deepEqual(result, { sent: false });
  assert.equal(calls.length, 1);
});

test("fetch exception returns false", async () => {
  setBrevoConfig();
  const calls = mockFetch(new Error("network unavailable for test"));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.com");

  assert.deepEqual(result, { sent: false });
  assert.equal(calls.length, 1);
});
