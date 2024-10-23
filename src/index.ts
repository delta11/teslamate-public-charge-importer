import { debugLoggingEnabled, loadCronPattern } from "./env.ts";
import { findAllConfiguredScrapers, loadTeslaMateInstance } from "./env.ts";
import type { Session } from "./sessions.ts";
import TeslaMate from "./teslamate/mock.ts";
import cron from "npm:node-cron";

async function runScrapeRoutine() {
  console.log("Starting");
  const teslaMate: TeslaMate = loadTeslaMateInstance();
  const teslaMateSessions: Session[] = await teslaMate
    .fetchLatestSessionsUnknownCost();
  if (teslaMateSessions.length == 0) {
    console.log(
      "No sessions without amount found, no need scraping anything",
    );
    Deno.exit(0);
  }
  console.log(
    `Loaded ${teslaMateSessions.length} sessions from TeslaMate to scrape for, starting scraping`,
  );

  const scrapers = await findAllConfiguredScrapers();
  const sessions: Session[] = (await Promise.all(
    scrapers.flatMap((scraper) => scraper.getRecentSessions()),
  ))[0];
  console.log(
    `Scraped ${sessions.length} from [${
      scrapers.map((scraper) => scraper.getName()).join(",")
    }] configured scrapers`,
  );

  const matchingSessions: { session1: Session; session2: Session }[] =
    findMatchingSessions(sessions, teslaMateSessions);
  if (debugLoggingEnabled()) {
    console.log("matchingSessions", matchingSessions);
  }
  console.log(
    `Writing cost for ${matchingSessions.length} matching sessions found`,
  );
  matchingSessions.forEach(async (matchingSession) => {
    const id = matchingSession.session2.id;
    if (!id) {
      throw Error(
        `Session ${matchingSession.session2} from DB doesn't have an ID???`,
      );
    }
    const cost = matchingSession.session1.cost;
    if (!cost) {
      throw Error(
        `Session ${matchingSession.session1} scraped doesn't have cost???`,
      );
    }
    await teslaMate.writeCost(id, cost);
  });
  console.log("Done sleeping until: " + loadCronPattern());
}
runScrapeRoutine();

cron.schedule(loadCronPattern(), () => {
  runScrapeRoutine();
});

function findMatchingSessions(
  array1: Session[],
  array2: Session[],
): { session1: Session; session2: Session }[] {
  const fiveMinutes: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  const tenMinutes: number = fiveMinutes * 2;
  const potentialMatches: { session1: Session; session2: Session }[] = [];

  const session1MatchCount: Map<Session, number> = new Map();
  const session2MatchCount: Map<Session, number> = new Map();

  array1.forEach((session1: Session) => {
    array2.forEach((session2: Session) => {
      if (
        Math.abs(session1.startDate - session2.startDate) <= tenMinutes &&
        Math.abs(session2.endDate - session2.endDate) <= fiveMinutes
      ) {
        potentialMatches.push({ session1, session2 });

        session1MatchCount.set(
          session1,
          (session1MatchCount.get(session1) || 0) + 1,
        );
        session2MatchCount.set(
          session2,
          (session2MatchCount.get(session2) || 0) + 1,
        );
      }
    });
  });

  const finalMatches: { session1: Session; session2: Session }[] =
    potentialMatches.filter(({ session1, session2 }) =>
      session1MatchCount.get(session1) === 1 &&
      session2MatchCount.get(session2) === 1
    );

  return finalMatches;
}
