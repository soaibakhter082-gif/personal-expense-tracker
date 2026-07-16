const localFallbackOrigin = "http://127.0.0.1:3001";

type SiteUrlEnvironment = Record<string, string | undefined>;

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function withVercelProtocol(value: string) {
  return /^[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app(?::\d{1,5})?$/i.test(
    value,
  )
    ? `https://${value}`
    : value;
}

function normalizeConfiguredOrigin(value: string | undefined) {
  const candidate = value?.trim();

  if (!candidate) {
    return "";
  }

  try {
    const url = new URL(withVercelProtocol(candidate));

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return stripTrailingSlashes(url.origin);
  } catch {
    return "";
  }
}

function getSafeHost(value: string | null) {
  const host = getFirstHeaderValue(value);

  if (
    !host ||
    host.includes("/") ||
    host.includes("\\") ||
    !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)
  ) {
    return "";
  }

  return host;
}

function getLocalProtocol(forwardedProto: string) {
  return forwardedProto === "https" ? "https" : "http";
}

function getTrustedLocalOrigin(requestHeaders: Headers) {
  const host =
    getSafeHost(requestHeaders.get("x-forwarded-host")) ||
    getSafeHost(requestHeaders.get("host"));

  if (!host) {
    return "";
  }

  const protocol = getLocalProtocol(
    getFirstHeaderValue(requestHeaders.get("x-forwarded-proto")),
  );

  return `${protocol}://${host}`;
}

export function getCanonicalSiteOrigin(
  requestHeaders: Headers,
  env: SiteUrlEnvironment = process.env,
) {
  return (
    normalizeConfiguredOrigin(env.NEXT_PUBLIC_SITE_URL) ||
    normalizeConfiguredOrigin(env.NEXT_PUBLIC_VERCEL_URL) ||
    getTrustedLocalOrigin(requestHeaders) ||
    localFallbackOrigin
  );
}

export function buildConfirmationRedirectUrl(origin: string) {
  return new URL("/auth/confirm?next=/dashboard", origin).toString();
}
