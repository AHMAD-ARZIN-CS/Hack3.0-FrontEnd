import type { AuthErrorCode } from "@/types/models";

export const PASSWORD_MIN = 8;

/** The only error type auth screens show verbatim. Anything else gets a generic message. */
export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string, public field?: string) {
    super(message);
    this.name = "AuthError";
  }
}
