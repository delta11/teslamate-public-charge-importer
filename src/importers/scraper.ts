import type { Session } from "../sessions.ts";

export default interface Scraper {
  getName(): string;
  getRecentSessions(): Promise<Session[]>;
}
