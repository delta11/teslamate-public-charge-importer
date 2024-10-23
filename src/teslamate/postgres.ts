/**
 * Internal notes
 * docker compose exec database psql teslamate teslamate
 * add port mapping to compose
 * ports:
  - "5432:5432"
 * ssh -L 5432:localhost:5432 <REMOTE MACHINE>
 */
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { Session } from "../sessions.ts";
import type TeslaMate from "./interface.ts";
import { debugLoggingEnabled } from "../env.ts";

export default class PostgresTeslaMate implements TeslaMate {
  private client: Client;
  constructor(username: string, password: string, hostname?: string) {
    this.client = new Client({
      user: username,
      database: "teslamate",
      hostname: hostname || "127.0.0.1",
      port: 5432,
      password: password,
    });
  }

  async fetchLatestSessionsUnknownCost(): Promise<Session[]> {
    if (!this.client.connected) {
      await this.client.connect();
    }
    const rows = await this.client.queryArray<Session[]>(
      `SELECT start_date, end_date, charge_energy_added, cost, id FROM charging_processes WHERE cost IS NULL AND start_date <= current_date + INTERVAL '3 MONTH' ORDER BY id;`,
    );
    const sessions = rows.rows.map((row) =>
      new Session(
        Date.parse(row[0]),
        Date.parse(row[1]),
        row[2],
        row[3],
        row[4],
      )
    );
    if (debugLoggingEnabled()) {
      console.log("Charging sessions from DB", sessions);
    }
    return sessions;
  }

  async writeCost(id: number, cost: number): Promise<void> {
    if (!this.client.connected) {
      await this.client.connect();
    }
    await this.client
      .queryObject("UPDATE charging_processes SET cost = $1 WHERE id = $2", [
        cost,
        id,
      ]);
  }
}
