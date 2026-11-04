export function toAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) return fallback;

  const err = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    error_description?: string;
  };
  const status = err.status ?? err.statusCode;
  const raw = String(err.message || err.error_description || fallback);
  const message = raw.toLowerCase();

  if (
    message.includes("over_email_send_rate_limit") ||
    message.includes("email rate limit")
  ) {
    return "Too many emails were just sent. Check your inbox and spam for an earlier code. If nothing arrived, wait about an hour and try once.";
  }

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return "Too many attempts. Wait several minutes and try once more.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Incorrect email or password.";
  }

  if (message.includes("email not confirmed")) {
    return "Please verify your email before signing in with a password. Use the code we emailed you, or request a new one.";
  }

  if (
    message.includes("token has expired") ||
    message.includes("otp_expired") ||
    message.includes("otp has expired")
  ) {
    return "That code has expired. Request a new one.";
  }

  if (
    message.includes("invalid") &&
    (message.includes("otp") || message.includes("token") || message.includes("code"))
  ) {
    return "That code is invalid. Check the email and try again.";
  }

  if (
    message.includes("password must be at least") ||
    message.includes("password should be at least") ||
    (message.includes("password") &&
      message.includes("at least") &&
      message.includes("character"))
  ) {
    return "Password must be at least 12 characters.";
  }

  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("network") || message.includes("failed to fetch")) {
    return "Network error. Check your connection and try again.";
  }

  if (raw.length <= 140 && !message.includes("jwt") && !message.includes("secret")) {
    return raw;
  }

  return fallback;
}
