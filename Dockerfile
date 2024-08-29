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
RUN yarn build && exit 1

# ##################################################
# # Setup Dependencies
# ##################################################
# FROM base AS dependancies
# ENV NODE_ENV=development
# COPY --chown=node:node ./package*.json ./
# COPY --chown=node:node ./npm* ./
# COPY --chown=node:node ./yarn* ./
# RUN yarn install --frozen-lockfile --production=false
# COPY --chown=node:node . .
# RUN yarn build
# RUN yarn package
# USER node

# ##################################################
# # Wrap for Production
# ##################################################
# FROM base AS production
# ARG VERSION=master
# ENV NODE_ENV=production
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