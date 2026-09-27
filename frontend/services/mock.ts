/** Mock-source helpers. Only services/* may import this. */
import { MOCK_LATENCY_MS } from "@/config/app";

/** Simulates network latency so loading states are real during development. */
export function mockDelay<T>(value: T, ms: number = MOCK_LATENCY_MS): Promise<T> {
  // structuredClone so UI code can never mutate the mock "database" by accident
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}
