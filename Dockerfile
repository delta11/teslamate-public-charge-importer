FROM denoland/deno:2.0.2

WORKDIR /app

ADD . /app

RUN deno install --entrypoint src/index.ts

CMD ["run", "--allow-net", "--allow-env", "src/index.ts"]