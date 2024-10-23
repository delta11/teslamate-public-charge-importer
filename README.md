# TeslaMate charge cost scraper
Add the ability to scrape public charging billing info into TeslaMate from different sources.

# Configuring TeslaMate
Go into the `docker-compose.yml` and add the following port mapping to the postgres database.
```yaml
ports:
  - "5432:5432"
```

Then configure `TESLA_MATE_CONF` environment variable as shown in `.sample-env` with your database username and password.

# Configuring scrapers
Have a look in `.sample-env` at the `SCRAPER_CONF` different scrapers can be configured.

## Road scraper
[E-Flux by Road](https://e-flux.io) can be scrapped the only argument needed is the bearer token.

To retrieve this go to [the dashboard](https://dashboard.e-flux.io/my-cards/usage) with the dev tools open. Inspect an URL like `https://api.e-flux.nl/1/active-sessions/mine` and then inspect the `authorization` header and grab all after the Bearer.


## TeslaScraper
Does not work at the moment needs to be moved to [Open Source Tokens](https://developer.tesla.com/docs/fleet-api/authentication/open-source-tokens). Failed to get the access tokens out of tesla mate it's self and simply using username password via puppeteer bounces into several captchas.

### How to get refresh token
https://tesla-info.com/tesla-token.php

## Running your machine
Get this repo on your machine and then
```shell
docker compose -f docker-compose.yml build
docker compose up
```
