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
