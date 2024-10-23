import { debugLoggingEnabled, loadTeslaMateInstance } from "../env.ts";
import { Session } from "../sessions.ts";
import type Scraper from "./scraper.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

export default class Tesla implements Scraper {
  private username: string;
  private password: string;
  private vin: string;

  constructor(args) {
    this.username = args.username;
    this.password = args.password;
    this.vin = args.vin;
  }

  getName(): string {
    return "Tesla";
  }

  async getRecentSessions(): Promise<Session[]> {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36";

    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 250,
      args: ["--no-sandbox"],
    });
    try {
      const page = await browser.newPage();
      page.setUserAgent(ua);
      await page.goto(
        "https://auth.tesla.com/en_us/oauth2/v1/authorize?redirect_uri=https%3A%2F%2Fwww.tesla.com%2Fteslaaccount%2Fowner-xp%2Fauth%2Fcallback&response_type=code&client_id=ownership&scope=offline_access%20openid%20ou_code%20email%20phone&audience=https%3A%2F%2Fownership.tesla.com%2F&locale=en-US",
        {
          waitUntil: "networkidle2",
        },
      );
      await page.waitForSelector("#form-input-identity");
      await page.type("#form-input-identity", this.username, { delay: 100 });
      await page.click("#form-submit-continue");
      await page.waitForSelector(".tds-form-input-password");
      await page.type(".tds-form-input-password", this.password, {
        delay: 100,
      });
      await page.click("#form-submit-continue");
      await page.waitForTimeout(4000);

      await page.goto(
        "https://www.tesla.com/teslaaccount/charging/api/history?vin=" +
          this.vin,
        {
          waitUntil: "networkidle2",
        },
      );
      const charges = await page.content();
      if (debugLoggingEnabled()) {
        console.log("Tesla scraped", charges);
      }
      return charges.map((charge) => {
        const startDate = Date.parse(charge.chargeStartDateTime);
        const endDate = Date.parse(charge.chargeStopDateTime);
        const kwh = charge.fees.map((fee) => fee.usageBase).reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        );
        const cost = charge.fees.map((fee) => fee.totalDue).reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        );
        return new Session(startDate, endDate, kwh, cost);
      });
    } finally {
      await browser.close();
    }
  }
}
