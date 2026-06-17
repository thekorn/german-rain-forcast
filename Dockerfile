FROM oven/bun:1.3-alpine AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
RUN bun run build:web && bun run build:server && bun run build:css


# copy production dependencies and source code into final image
FROM base AS release
# we don't need to copy node_modules from install stage as the server is bundled
#COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist/ dist/
COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER bun
EXPOSE 3000/tcp

CMD ["bun", "run", "start"]
