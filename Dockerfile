ARG IMAGE_PREFIX=
ARG NODE_IMAGE=node:21-alpine
ARG BUILDPLATFORM=amd64
FROM --platform=${BUILDPLATFORM} ${IMAGE_PREFIX}${NODE_IMAGE} as base

##################################################
# Setup the Base Container
##################################################
ENV LC_ALL=C.UTF-8
RUN apk --no-cache add dumb-init
RUN mkdir -p /home/node/app && \
    chown node:node /home/node/app && \
    mkdir -p /home/node/mediamtx && \
    chown node:node /home/node/mediamtx
WORKDIR /home/node/app
USER node

##################################################
# Build the GUI
##################################################
FROM base AS gui
ENV NODE_ENV=development
COPY --chown=node:node ./gui/package*.json ./
COPY --chown=node:node ./gui/npm* ./
COPY --chown=node:node ./gui/yarn* ./
RUN yarn install --frozen-lockfile --production=false --ignore-engines
COPY --chown=node:node ./gui .
RUN yarn build

##################################################
# Setup Dependencies
##################################################
FROM base AS dependencies
ENV NODE_ENV=development
USER root
RUN apk add --no-cache \
    build-base \
    python3 \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    g++ \
    make
USER node
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./npm* ./
COPY --chown=node:node ./yarn* ./
RUN yarn install --frozen-lockfile

##################################################
# Setup Production Dependencies
##################################################
FROM base AS production-dependencies
ENV NODE_ENV=production
USER root
RUN apk add --no-cache \
    build-base \
    python3 \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    g++ \
    make
USER node
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./npm* ./
COPY --chown=node:node ./yarn* ./
RUN yarn install --frozen-lockfile --production=true

##################################################
# Build
##################################################
FROM base AS build
ENV NODE_ENV=production
COPY --from=dependencies /home/node/app/node_modules /home/node/app/node_modules
ADD . .
RUN node ace build

##################################################
# Wrap for Production
##################################################
FROM base AS production
ENV NODE_ENV=production
COPY --from=production-dependencies /home/node/app/node_modules /home/node/app/node_modules
COPY --from=build /home/node/app/build /home/node/app
RUN rm -rf /home/node/app/public
COPY --from=gui /home/node/app/.output/public /home/node/app/public
USER root
RUN apk add --no-cache \
    ffmpeg \
    gst-plugins-base \
    gst-plugins-good \
    gst-plugins-bad \
    gst-plugins-ugly \
    gstreamer-dev \
    gst-libav
USER node
ENV MEDIA_MTX_PATH=/home/node/mediamtx/mediamtx
ENV MEDIA_MTX_CONFIG_PATH=/home/node/mediamtx/mediamtx.yml
RUN node ace mediamtx:install
# COPY --chown=node:node --from=build /home/node/app/dist ./package*.json ./
# COPY --chown=node:node --from=build /home/node/app/dist ./npm* ./
# COPY --chown=node:node --from=build /home/node/app/dist ./yarn* ./
# COPY --chown=node:node --from=build /home/node/app/dist ./.yarn* ./
# USER root
# RUN apk --no-cache add python3 g++ make
# USER node
# RUN yarn install --frozen-lockfile --production
# USER root
# RUN apk del python3 g++ make
# COPY --chown=node:node --from=build /home/node/app/dist .
# USER node
# RUN { \
#     echo "VERSION=${VERSION}"; \
#     } > /home/node/app/.env
# CMD [ "dumb-init", "node", "index.mjs" ]