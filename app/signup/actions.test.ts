import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const forbiddenSignupRedirectOption = new RegExp("email" + "RedirectTo");
const forbiddenRedirectBuilder = new RegExp("build" + "ConfirmationRedirectUrl");
const forbiddenOriginHelper = new RegExp("get" + "CanonicalSiteOrigin");
const oldSignupSuccessText = new RegExp(
  "Check your " + "email|confirm your " + "account",
  "i",
);
const oldLoginMessage = new RegExp(
  "Confirm your " + "email address before logging in",
);
const oldLoginQuery = "email" + "-confirmed";
const oldResendComponent = "Resend" + "ConfirmationForm";
const oldConfirmationEmailText = new RegExp("confirmation " + "email");

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("signup creates an immediate session without confirmation redirects", () => {
  const source = read("app/signup/actions.ts");

  assert.equal(source.match(/auth\.signUp\(/g)?.length ?? 0, 1);
  assert.doesNotMatch(source, forbiddenSignupRedirectOption);
  assert.doesNotMatch(source, forbiddenRedirectBuilder);
  assert.doesNotMatch(source, forbiddenOriginHelper);
  assert.match(source, /const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+supabase\.auth\.signUp\(\{[\s\S]*email,[\s\S]*password,[\s\S]*\}\)/);
  assert.match(source, /signupData\?\.session/);
  assert.match(source, /access_token/);
  assert.match(source, /refresh_token/);
  assert.match(source, /redirect\("\/dashboard"\)/);
  assert.doesNotMatch(source, oldSignupSuccessText);
});

test("signup sends one welcome email after a usable session and still redirects", () => {
  const source = read("app/signup/actions.ts");
  const sessionCheckIndex = source.indexOf("if (!hasUsableSession");
  const welcomeEmailIndex = source.indexOf(
    "const welcomeResult = await sendWelcomeEmail(email);",
  );
  const welcomeLogIndex = source.indexOf(
    'console.info("[signup] welcome email result"',
  );
  const redirectIndex = source.indexOf('redirect("/dashboard");');
  const errorReturnIndex = source.indexOf("if (error)");
  const welcomeLogSnippet = source.slice(welcomeLogIndex, redirectIndex);

  assert.match(
    source,
    /import\s+\{\s*sendWelcomeEmail\s*\}\s+from\s+"@\/lib\/email\/sendWelcomeEmail";/,
  );
  assert.equal(source.match(/sendWelcomeEmail\(email\)/g)?.length ?? 0, 1);
  assert.ok(sessionCheckIndex > -1);
  assert.ok(welcomeEmailIndex > sessionCheckIndex);
  assert.ok(welcomeEmailIndex > errorReturnIndex);
  assert.ok(welcomeLogIndex > welcomeEmailIndex);
  assert.ok(redirectIndex > welcomeLogIndex);
  assert.match(
    source,
    /sent:\s*welcomeResult\.sent[\s\S]*stage:\s*welcomeResult\.stage[\s\S]*status:\s*welcomeResult\.status[\s\S]*providerCode:\s*welcomeResult\.providerCode/,
  );
  assert.doesNotMatch(source, /if\s*\(\s*welcomeResult\.sent\s*\)/);
  assert.doesNotMatch(welcomeLogSnippet, /email\s*:/);
});

test("login no longer exposes confirmation-email messaging", () => {
  const loginAction = read("app/login/actions.ts");
  const loginPage = read("app/login/page.tsx");

  assert.doesNotMatch(loginAction, oldLoginMessage);
  assert.equal(loginPage.includes(oldLoginQuery), false);
  assert.equal(loginPage.includes(oldResendComponent), false);
  assert.doesNotMatch(loginPage, oldConfirmationEmailText);
});

test("resend confirmation flow files are removed", () => {
  assert.equal(existsSync(new URL("../login/resend-actions.ts", import.meta.url)), false);
  assert.equal(
    existsSync(
      new URL(
        "../../components/" + "Resend" + "ConfirmationForm.tsx",
        import.meta.url,
      ),
    ),
    false,
  );
});
