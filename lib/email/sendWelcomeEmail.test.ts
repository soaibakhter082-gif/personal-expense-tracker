import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { afterEach } from "node:test";
import ts from "typescript";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const originalFetch = globalThis.fetch;
const originalApiKey = process.env.BREVO_API_KEY;
const originalSenderEmail = process.env.BREVO_SENDER_EMAIL;
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;

type WelcomeEmailResult = {
  sent: boolean;
  stage: "configuration" | "request" | "response" | "success";
  status?: number;
  providerCode?: string;
};

type FetchCall = {
  input: string | URL | Request;
  init?: RequestInit;
};

type CapturedLog = {
  level: "info" | "error";
  message: string;
  details: unknown;
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
    sendWelcomeEmail: (recipientEmail: string) => Promise<WelcomeEmailResult>;
  };

  return loadedModule.sendWelcomeEmail;
}

function setBrevoConfig() {
  process.env.BREVO_API_KEY = "test-api-key-value";
  process.env.BREVO_SENDER_EMAIL = " sender@example.invalid ";
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

function captureConsole() {
  const logs: CapturedLog[] = [];

  console.info = ((message: string, details: unknown) => {
    logs.push({ level: "info", message, details });
  }) as typeof console.info;
  console.error = ((message: string, details: unknown) => {
    logs.push({ level: "error", message, details });
  }) as typeof console.error;

  return logs;
}

function getRequestBody(call: FetchCall) {
  const body = call.init?.body;

  if (typeof body !== "string") {
    throw new TypeError("Expected request body to be a string.");
  }

  return JSON.parse(body);
}

function assertLogsAreSafe(logs: CapturedLog[]) {
  const serialized = JSON.stringify(logs);

  assert.equal(serialized.includes("new-user@example.invalid"), false);
  assert.equal(serialized.includes("test-api-key-value"), false);
  assert.equal(serialized.includes("sender@example.invalid"), false);
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.info = originalConsoleInfo;
  console.error = originalConsoleError;

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

test("successful Brevo response sends the welcome email request and logs safe acceptance", async () => {
  setBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(
    new Response(JSON.stringify({ messageId: "provider-message-id" }), {
      status: 201,
      statusText: "Created",
    }),
  );
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, { sent: true, stage: "success", status: 201 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.input, brevoEndpoint);
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.cache, "no-store");
  assert.ok(calls[0]?.init?.signal instanceof AbortSignal);
  assert.deepEqual(calls[0]?.init?.headers, {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": "test-api-key-value",
  });

  const body = getRequestBody(calls[0]);

  assert.deepEqual(body.sender, {
    name: "Personal Expense Tracker",
    email: "sender@example.invalid",
  });
  assert.deepEqual(body.to, [{ email: "new-user@example.invalid" }]);
  assert.equal(
    body.subject,
    "Your Personal Expense Tracker account was created",
  );
  assert.match(body.textContent, /account has been created successfully/i);
  assert.match(body.htmlContent, /Account created successfully/);
  assert.doesNotMatch(JSON.stringify(body), /confirm|token|password|access_token|refresh_token/i);
  assert.deepEqual(logs.map((log) => log.message), [
    "[welcome-email] attempt",
    "[welcome-email] response",
    "[welcome-email] accepted",
  ]);
  assert.deepEqual(logs[0]?.details, {
    stage: "configuration",
    apiKeyConfigured: true,
    senderConfigured: true,
  });
  assert.deepEqual(logs[2]?.details, {
    stage: "success",
    status: 201,
    messageIdReturned: true,
  });
  assertLogsAreSafe(logs);
});

test("missing API key returns configuration result without calling fetch", async () => {
  process.env.BREVO_SENDER_EMAIL = "sender@example.invalid";
  delete process.env.BREVO_API_KEY;
  const logs = captureConsole();
  const calls = mockFetch(new Response("{}", { status: 201 }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, { sent: false, stage: "configuration" });
  assert.equal(calls.length, 0);
  assert.deepEqual(logs[0]?.details, {
    stage: "configuration",
    apiKeyConfigured: false,
    senderConfigured: true,
  });
  assertLogsAreSafe(logs);
});

test("missing sender returns configuration result without calling fetch", async () => {
  process.env.BREVO_API_KEY = "test-api-key-value";
  delete process.env.BREVO_SENDER_EMAIL;
  const logs = captureConsole();
  const calls = mockFetch(new Response("{}", { status: 201 }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, { sent: false, stage: "configuration" });
  assert.equal(calls.length, 0);
  assert.deepEqual(logs[0]?.details, {
    stage: "configuration",
    apiKeyConfigured: true,
    senderConfigured: false,
  });
  assertLogsAreSafe(logs);
});

test("missing Brevo configuration returns false without calling fetch", async () => {
  clearBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(new Response("{}", { status: 201 }));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, { sent: false, stage: "configuration" });
  assert.equal(calls.length, 0);
  assertLogsAreSafe(logs);
});

test("400 Brevo response returns response diagnostics", async () => {
  setBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(
    new Response(
      JSON.stringify({
        code: "invalid_parameter",
        message: "Sender is invalid for this test response.",
      }),
      { status: 400, statusText: "Bad Request" },
    ),
  );
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, {
    sent: false,
    stage: "response",
    status: 400,
    providerCode: "invalid_parameter",
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(logs.at(-1)?.details, {
    stage: "response",
    status: 400,
    code: "invalid_parameter",
    message: "400: invalid request or sender - Sender is invalid for this test response.",
  });
  assertLogsAreSafe(logs);
});

test("401 Brevo response returns response diagnostics", async () => {
  setBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(
    new Response(
      JSON.stringify({
        code: "unauthorized",
        message: "Key rejected for this test response.",
      }),
      { status: 401, statusText: "Unauthorized" },
    ),
  );
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, {
    sent: false,
    stage: "response",
    status: 401,
    providerCode: "unauthorized",
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(logs.at(-1)?.details, {
    stage: "response",
    status: 401,
    code: "unauthorized",
    message: "401: missing/invalid API key - Key rejected for this test response.",
  });
  assertLogsAreSafe(logs);
});

test("403 Brevo response returns response diagnostics", async () => {
  setBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(
    new Response(
      JSON.stringify({
        code: "forbidden",
        message: "Permission denied for this test response.",
      }),
      { status: 403, statusText: "Forbidden" },
    ),
  );
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, {
    sent: false,
    stage: "response",
    status: 403,
    providerCode: "forbidden",
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(logs.at(-1)?.details, {
    stage: "response",
    status: 403,
    code: "forbidden",
    message: "403: permission/account/IP restriction - Permission denied for this test response.",
  });
  assertLogsAreSafe(logs);
});

test("fetch exception returns request diagnostics", async () => {
  setBrevoConfig();
  const logs = captureConsole();
  const calls = mockFetch(new Error("network unavailable for test"));
  const sendWelcomeEmail = await loadSendWelcomeEmail();

  const result = await sendWelcomeEmail("new-user@example.invalid");

  assert.deepEqual(result, { sent: false, stage: "request" });
  assert.equal(calls.length, 1);
  assert.deepEqual(logs.at(-1)?.details, {
    stage: "request",
    name: "Error",
    message: "network unavailable for test",
  });
  assertLogsAreSafe(logs);
});
