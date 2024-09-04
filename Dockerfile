ARG IMAGE_PREFIX=
ARG NODE_IMAGE=node:21-alpine
ARG BUILDPLATFORM=amd64
FROM --platform=${BUILDPLATFORM} ${IMAGE_PREFIX}${NODE_IMAGE} AS base

##################################################
# Setup the Base Container
##################################################
ENV LC_ALL=C.UTF-8
RUN addgroup -S nestmtx && adduser -S nestmtx -G nestmtx -u 1001
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
    mkdir -p /home/nestmtx/app && \
    mkdir -p /home/nestmtx/app/tmp && \
    chown -R nestmtx:nestmtx /home/nestmtx/app && \
    mkdir -p /home/nestmtx/mediamtx && \
    chown -R nestmtx:nestmtx /home/nestmtx/mediamtx

WORKDIR /home/nestmtx/app
USER nestmtx
RUN yarn config set network-timeout 300000 -g

##################################################
# Build the GUI
##################################################
FROM base AS gui
ARG VERSION=unknown
ENV NODE_ENV=development
COPY --chown=nestmtx:nestmtx ./gui/package*.json ./
COPY --chown=nestmtx:nestmtx ./gui/npm* ./
COPY --chown=nestmtx:nestmtx ./gui/yarn* ./
RUN yarn install --frozen-lockfile --production=false --ignore-engines
COPY --chown=nestmtx:nestmtx ./gui .
RUN yarn build

##################################################
# Setup Dependencies
##################################################
FROM base AS dependencies
ENV NODE_ENV=development
COPY --chown=nestmtx:nestmtx ./package*.json ./
COPY --chown=nestmtx:nestmtx ./npm* ./
COPY --chown=nestmtx:nestmtx ./yarn* ./
USER nestmtx
RUN yarn install --frozen-lockfile

##################################################
# Setup Production Dependencies
##################################################
FROM base AS production-dependencies
ENV NODE_ENV=production
USER nestmtx
COPY --chown=nestmtx:nestmtx ./package*.json ./
COPY --chown=nestmtx:nestmtx ./npm* ./
COPY --chown=nestmtx:nestmtx ./yarn* ./
RUN yarn install --frozen-lockfile --production=true

##################################################
# Build
##################################################
FROM base AS build
ENV NODE_ENV=production
COPY --from=dependencies /home/nestmtx/app/node_modules /home/nestmtx/app/node_modules
ADD --chown=nestmtx:nestmtx . .
RUN node ace build
ENV MEDIA_MTX_PATH=/home/nestmtx/mediamtx/mediamtx
ENV MEDIA_MTX_CONFIG_PATH=/home/nestmtx/mediamtx/mediamtx.yml
RUN node ace mediamtx:install

##################################################
# Wrap for Production
##################################################
FROM base AS production
ENV NODE_ENV=production
ARG VERSION=unknown
ARG BUILDPLATFORM=local
ARG SHA=unknown
USER nestmtx
COPY --from=production-dependencies /home/nestmtx/app/node_modules /home/nestmtx/app/node_modules
COPY --from=build /home/nestmtx/app/build /home/nestmtx/app
ADD --chown=nestmtx:nestmtx /logger-transports /home/nestmtx/app/logger-transports
ADD --chown=nestmtx:nestmtx /resources /home/nestmtx/app/resources
RUN rm -rf /home/nestmtx/app/public
COPY --from=gui /home/nestmtx/app/.output/public /home/nestmtx/app/public
COPY --from=build /home/nestmtx/mediamtx /home/nestmtx/mediamtx
USER root
RUN chown -R nestmtx:nestmtx /home/nestmtx
RUN { \
    echo "VERSION=${VERSION}"; \
    echo "BUILDPLATFORM=${BUILDPLATFORM}"; \
    echo "SHA=${SHA}"; \
    } > /home/nestmtx/app/version.txt
USER nestmtx
EXPOSE 2000
EXPOSE 2001
EXPOSE 9996
EXPOSE 8554
EXPOSE 8000/udp
EXPOSE 8001/udp
EXPOSE 1935
EXPOSE 8888
EXPOSE 8889
EXPOSE 8189/udp
EXPOSE 8890
CMD [ "dumb-init", "node", "bin/docker.js" ]
VOLUME [ "/home/nestmtx/app/tmp" ]