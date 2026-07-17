import "server-only";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const requestTimeoutMs = 10_000;
const senderName = "Personal Expense Tracker";
const subject = "Your Personal Expense Tracker account was created";
const textContent =
  "Your account has been created successfully in Personal Expense Tracker. You can now log in and manage your private expenses.";
const htmlContent =
  "<h2>Account created successfully</h2><p>Your account has been created successfully in <strong>Personal Expense Tracker</strong>.</p><p>You can now log in and manage your private expenses.</p><p>If you did not create this account, you can ignore this email.</p>";

type WelcomeEmailResult = {
  sent: boolean;
  stage: "configuration" | "request" | "response" | "success";
  status?: number;
  providerCode?: string;
};

function isReasonableEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function hasBrevoConfig(apiKey: string | undefined, senderEmail: string) {
  return Boolean(apiKey?.trim()) && Boolean(senderEmail) && isReasonableEmail(senderEmail);
}

function getShortMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

function logAttempt(apiKey: string | undefined, senderEmail: string) {
  console.info("[welcome-email] attempt", {
    stage: "configuration",
    apiKeyConfigured: Boolean(apiKey),
    senderConfigured: Boolean(senderEmail),
  });
}

function logResponse(response: Response) {
  console.info("[welcome-email] response", {
    stage: "response",
    status: response.status,
    ok: response.ok,
  });
}

function logFetchException(error: unknown) {
  if (error instanceof Error) {
    console.error("[welcome-email] request failed", {
      stage: "request",
      name: error.name,
      message: getShortMessage(error.message),
    });

    return;
  }

  console.error("[welcome-email] request failed", {
    stage: "request",
    message: "Unknown welcome email error.",
  });
}

function getStatusSummary(status: number) {
  if (status === 400) {
    return "400: invalid request or sender";
  }

  if (status === 401) {
    return "401: missing/invalid API key";
  }

  if (status === 403) {
    return "403: permission/account/IP restriction";
  }

  if (status === 429) {
    return "429: Brevo rate limit";
  }

  if (status >= 500 && status <= 599) {
    return `${status}: Brevo server error`;
  }

  return `${status}: Brevo rejected request`;
}

function normalizeProviderValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function safelyReadJson(response: Response) {
  try {
    const body = (await response.json()) as {
      code?: unknown;
      message?: unknown;
      messageId?: unknown;
    };

    return {
      code: normalizeProviderValue(body.code),
      message: normalizeProviderValue(body.message),
      messageId: normalizeProviderValue(body.messageId),
    };
  } catch {
    return {};
  }
}

function buildProviderMessage(status: number, message: string | undefined) {
  const summary = getStatusSummary(status);
  const shortMessage = getShortMessage(message);

  return shortMessage ? `${summary} - ${shortMessage}` : summary;
}

function logBrevoRejection(
  response: Response,
  providerDetails: { code?: string; message?: string },
) {
  console.error("[welcome-email] Brevo rejected request", {
    stage: "response",
    status: response.status,
    code: providerDetails.code,
    message: buildProviderMessage(response.status, providerDetails.message),
  });
}

function logAccepted(response: Response, messageId: string | undefined) {
  console.info("[welcome-email] accepted", {
    stage: "success",
    status: response.status,
    messageIdReturned: Boolean(messageId),
  });
}

export async function sendWelcomeEmail(
  recipientEmail: string,
): Promise<WelcomeEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() ?? "";

  logAttempt(apiKey, senderEmail);

  if (!hasBrevoConfig(apiKey, senderEmail)) {
    return { sent: false, stage: "configuration" };
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), requestTimeoutMs);

  try {
    const response = await fetch(brevoEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey as string,
      },
      cache: "no-store",
      signal: abortController.signal,
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: recipientEmail,
          },
        ],
        subject,
        textContent,
        htmlContent,
      }),
    });
    clearTimeout(timeout);

    logResponse(response);

    if (!response.ok) {
      const providerDetails = await safelyReadJson(response);
      logBrevoRejection(response, providerDetails);

      return {
        sent: false,
        stage: "response",
        status: response.status,
        providerCode: providerDetails.code,
      };
    }

    const providerDetails = await safelyReadJson(response);
    logAccepted(response, providerDetails.messageId);

    return { sent: true, stage: "success", status: response.status };
  } catch (error) {
    clearTimeout(timeout);
    logFetchException(error);

    return { sent: false, stage: "request" };
  }
}
