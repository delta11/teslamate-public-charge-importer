import { debugLoggingEnabled } from "../env.ts";
import { Session } from "../sessions.ts";
import type Scraper from "./scraper.ts";

export default class Road implements Scraper {
  private two_hours = 3_600_000 * 2;
  private bearer: string;

  constructor(args: { bearer: string }) {
    this.bearer = args.bearer;
  }

  getName(): string {
    return "Road";
  }

  async getRecentSessions(): Promise<Session[]> {
    const response = await fetch("https://api.e-flux.nl/1/sessions/mine", {
      "headers": {
        "accept": "application/json",
        "authorization": `Bearer ${this.bearer}`,
        "content-type": "application/json",
      },
      "body":
        '{"limit":20,"sort":{"order":"desc","field":"startedAt"},"skip":0}',
      "method": "POST",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // if (debugLoggingEnabled()) {
    //   console.log("Road scraped", data);
    // }
    const charges = data.data;
    return charges.map((charge) => {
      const startDate = Date.parse(charge.startedAt) - this.two_hours;
      const endDate = Date.parse(charge.endedAt);
      const cost = charge.priceWithFX.originalAmountWithVAT.toFixed(2);
      return new Session(startDate, endDate, charge.kwh, cost);
    });
  }
}
