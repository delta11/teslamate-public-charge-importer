import MockTeslaMate from "./teslamate/mock.ts";
import TeslaMate from "./teslamate/interface.ts";
import PostgresTeslaMate from "./teslamate/postgres.ts";
import type Scraper from "./importers/scraper.ts";

export function findAllConfiguredScrapers(): Promise<Scraper[]> {
  const scrapersConfString = Deno.env.get("SCRAPER_CONF");
  if (scrapersConfString == undefined) {
    console.error("Missing SCRAPER_CONF Environment variable");
    Deno.exit(1);
  }
  const scrapersConf = JSON.parse(scrapersConfString);
  return Promise.all(scrapersConf.map(async (scraperConf) => {
    const module = await import(`./importers/${scraperConf.type}.ts`);
    const classRef = module.default;
    if (!classRef) {
      throw new Error(`Scraper ${scraperConf.type} not found`);
    }
    if ("args" in scraperConf) {
      return new classRef(scraperConf.args);
    } else {
      return new classRef();
    }
  }));
}

export function loadTeslaMateInstance(): TeslaMate {
  const teslaMateConfString = Deno.env.get("TESLA_MATE_CONF");
  if (teslaMateConfString == undefined) {
    console.error("Missing TESLA_MATE_CONF Environment variable");
    Deno.exit(1);
  }
  const teslaMateConf = JSON.parse(teslaMateConfString);
  if (teslaMateConf.mocked) {
    console.log("Loading mocked tesla mate impl");
    return new MockTeslaMate();
  } else {
    return new PostgresTeslaMate(
      teslaMateConf.username,
      teslaMateConf.password,
      teslaMateConf.hostname,
    );
  }
}

export function loadCronPattern(): string {
  return Deno.env.get("CRON_PATTERN") || "5 4 * * *";
}

export function debugLoggingEnabled(): boolean {
  return Deno.env.get("DEBUG") == "true";
}
