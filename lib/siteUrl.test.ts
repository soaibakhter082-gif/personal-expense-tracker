import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConfirmationRedirectUrl,
  getCanonicalSiteOrigin,
} from "./siteUrl";

function makeHeaders(values: Record<string, string>) {
  return new Headers(values);
}

test("uses NEXT_PUBLIC_SITE_URL before request host", () => {
  const origin = getCanonicalSiteOrigin(
    makeHeaders({
      "x-forwarded-host": "temporary-preview.vercel.app",
      "x-forwarded-proto": "https",
    }),
    {
      NEXT_PUBLIC_SITE_URL: "https://personal-expense-tracker-blush.vercel.app/",
    },
  );

  assert.equal(origin, "https://personal-expense-tracker-blush.vercel.app");
});

test("adds https to Vercel hosts without a protocol", () => {
  const origin = getCanonicalSiteOrigin(makeHeaders({}), {
    NEXT_PUBLIC_VERCEL_URL: "personal-expense-tracker-blush.vercel.app",
  });

  assert.equal(origin, "https://personal-expense-tracker-blush.vercel.app");
});

test("uses trusted local request origin for development", () => {
  const origin = getCanonicalSiteOrigin(
    makeHeaders({
      host: "127.0.0.1:3001",
      "x-forwarded-proto": "http",
    }),
    {},
  );

  assert.equal(origin, "http://127.0.0.1:3001");
});

test("falls back to local app URL when no trusted origin exists", () => {
  const origin = getCanonicalSiteOrigin(makeHeaders({ host: "bad/host" }), {});

  assert.equal(origin, "http://127.0.0.1:3001");
});

test("builds the confirmation redirect without duplicate slashes", () => {
  const redirectUrl = buildConfirmationRedirectUrl(
    "https://personal-expense-tracker-blush.vercel.app/",
  );

  assert.equal(
    redirectUrl,
    "https://personal-expense-tracker-blush.vercel.app/auth/confirm?next=/dashboard",
  );
});
