import type { Session } from "../sessions.ts";

export default interface TeslaMate {
  fetchLatestSessionsUnknownCost(): Promise<Session[]>;
  writeCost(id: number, cost: number): Promise<void>;
}
