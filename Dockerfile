ARG IMAGE_PREFIX=
ARG NODE_IMAGE=node:21-alpine
ARG BUILDPLATFORM=amd64
FROM --platform=${BUILDPLATFORM} ${IMAGE_PREFIX}${NODE_IMAGE} AS base

##################################################
# Setup the Base Container
##################################################
ENV LC_ALL=C.UTF-8
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk --no-cache add dumb-init \
    openssl \
    ffmpeg \
    gstreamer-tools \
    gst-plugins-base \
    gst-plugins-good \
    gst-plugins-bad \
    gst-plugins-ugly \
    gst-rtsp-server \
    gstreamer-dev \
    gst-libav \
    build-base \
    python3 \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    g++ \
    make && \
    mkdir -p /home/node/app && \
    mkdir -p /home/node/app/tmp && \
    chown -R node:node /home/node/app && \
    mkdir -p /home/node/mediamtx && \
    chown -R node:node /home/node/mediamtx

WORKDIR /home/node/app
USER node
RUN yarn config set network-timeout 300000 -g

##################################################
# Build the GUI
##################################################
FROM base AS gui
ARG VERSION=unknown
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
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./npm* ./
COPY --chown=node:node ./yarn* ./
USER node
RUN yarn install --frozen-lockfile

##################################################
# Setup Production Dependencies
##################################################
FROM base AS production-dependencies
ENV NODE_ENV=production
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
ADD --chown=node:node . .
RUN node ace build
ENV MEDIA_MTX_PATH=/home/node/mediamtx/mediamtx
ENV MEDIA_MTX_CONFIG_PATH=/home/node/mediamtx/mediamtx.yml
RUN node ace mediamtx:install

##################################################
# Wrap for Production
##################################################
FROM base AS production
ENV NODE_ENV=production
ARG VERSION=unknown
ARG BUILDPLATFORM=local
ARG SHA=unknown
USER node
COPY --from=production-dependencies /home/node/app/node_modules /home/node/app/node_modules
COPY --from=build /home/node/app/build /home/node/app
ADD --chown=node:node /logger-transports /home/node/app/logger-transports
ADD --chown=node:node /resources /home/node/app/resources
RUN rm -rf /home/node/app/public
COPY --from=gui /home/node/app/.output/public /home/node/app/public
COPY --from=build /home/node/mediamtx /home/node/mediamtx
USER root
RUN chown -R node:node /home/node
RUN { \
    echo "VERSION=${VERSION}"; \
    echo "BUILDPLATFORM=${BUILDPLATFORM}"; \
    echo "SHA=${SHA}"; \
    } > /home/node/app/version.txt
USER node
CMD [ "dumb-init", "node", "bin/docker.js" ]
VOLUME [ "/home/node/app/tmp" ]