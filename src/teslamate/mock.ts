import { Session } from "../sessions.ts";
import type TeslaMate from "./interface.ts";

export default class MockTeslaMate implements TeslaMate {
  fetchLatestSessionsUnknownCost(): Promise<Session[]> {
    return Promise.resolve([
      new Session(
        Date.parse("2024-10-05T11:01:29.244Z"),
        Date.parse("2024-10-05T11:01:25.000Z"),
        27,
        undefined,
        1,
      ),
    ]);
  }

  writeCost(id: number, cost: number): Promise<void> {
    console.log(`Received mock write to id ${id} with cost ${cost}`);
    return Promise.resolve();
  }
}
