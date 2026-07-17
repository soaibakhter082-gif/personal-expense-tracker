import "server-only";

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const senderName = "Personal Expense Tracker";
const subject = "Your Personal Expense Tracker account was created";
const textContent =
  "Your account has been created successfully in Personal Expense Tracker. You can now log in and manage your private expenses.";
const htmlContent =
  "<h2>Account created successfully</h2><p>Your account has been created successfully in <strong>Personal Expense Tracker</strong>.</p><p>You can now log in and manage your private expenses.</p><p>If you did not create this account, you can ignore this email.</p>";

function hasBrevoConfig(apiKey: string | undefined, senderEmail: string | undefined) {
  return Boolean(apiKey?.trim()) && Boolean(senderEmail?.trim());
}

function getShortMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message.length > 180 ? `${message.slice(0, 180)}...` : message;
}

function logMissingConfiguration() {
  console.error("[welcome-email] Email delivery skipped", {
    stage: "validate-brevo-configuration",
    code: "missing_configuration",
  });
}

function logBrevoFailure(response: Response) {
  console.error("[welcome-email] Brevo request failed", {
    stage: "send-brevo-email",
    status: response.status,
    statusText: response.statusText,
  });
}

function logFetchException(error: unknown) {
  if (error instanceof Error) {
    console.error("[welcome-email] Brevo request exception", {
      name: error.name,
      message: getShortMessage(error.message),
    });

    return;
  }

  console.error("[welcome-email] Brevo request exception", {
    message: "Unknown welcome email error.",
  });
}

export async function sendWelcomeEmail(
  recipientEmail: string,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!hasBrevoConfig(apiKey, senderEmail)) {
    logMissingConfiguration();

    return { sent: false };
  }

  try {
    const response = await fetch(brevoEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey as string,
      },
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

    if (!response.ok) {
      logBrevoFailure(response);

      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    logFetchException(error);

    return { sent: false };
  }
}
