/**
 * Error handling utility for sanitizing error messages
 * In production, detailed errors are logged server-side only
 * Generic messages are returned to clients to prevent information disclosure
 */

/**
 * Sanitizes error messages for client display
 * In production, returns generic messages to prevent information disclosure
 * In development, returns detailed error messages for debugging
 */
export function sanitizeError(error: unknown): Error {
  const isProduction = import.meta.env.PROD;

  // In production, minimize console logging to prevent information disclosure
  // Detailed errors should be sent to external error tracking service (Sentry, etc.)
  if (isProduction) {
    // Only log sanitized error messages in production
    // Stack traces and detailed error objects are not logged to console
    if (error instanceof Error) {
      // Log only the error type and a sanitized message (no stack traces)
      const sanitizedMessage = error.message
        .replace(/[^\w\s.,!?-]/g, "") // Remove special characters that might leak info
        .substring(0, 100); // Limit length
      console.error("Error:", sanitizedMessage);

      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // Example:
      // if (window.Sentry) {
      //   window.Sentry.captureException(error);
      // }
    } else {
      console.error("An error occurred");
    }
  } else {
    // Development: full error details for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      console.error("Error details:", error);
    }
  }

  // In production, return generic error messages
  if (isProduction) {
    // Check for common error types and return appropriate generic messages
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Authentication errors
      if (
        message.includes("auth") ||
        message.includes("login") ||
        message.includes("password")
      ) {
        return new Error(
          "Authentication failed. Please check your credentials."
        );
      }

      // Network errors
      if (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("connection")
      ) {
        return new Error(
          "Network error. Please check your connection and try again."
        );
      }

      // Validation errors (safe to show)
      if (
        message.includes("invalid") ||
        message.includes("required") ||
        message.includes("must be")
      ) {
        return error; // Validation errors are safe to show
      }

      // Rate limiting errors (safe to show)
      if (message.includes("too many") || message.includes("rate limit")) {
        return error; // Rate limit messages are safe to show
      }

      // Generic error
      return new Error("An error occurred. Please try again.");
    }

    // Unknown error type
    return new Error("An error occurred. Please try again.");
  }

  // In development, return detailed errors
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

/**
 * Creates a safe error message for API responses
 */
export function createSafeErrorMessage(error: unknown): string {
  const sanitized = sanitizeError(error);
  return sanitized.message;
}
