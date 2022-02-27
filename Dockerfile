FROM node:14.19.0-slim AS BUILD_IMAGE

RUN apt-get update \
    && apt-get install -y python make gcc g++ git

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --production=true

COPY . .

# workaround for "Container ID 887432 cannot be mapped to a host ID" when using userns-remap
RUN chown -R root:root /usr/src/app

FROM node:14.19.0-slim

LABEL group="app.obyte"
LABEL app="orider"
LABEL component="web"
LABEL role="web"

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app ./

USER node

RUN mkdir -v -p "/home/node/.config/byteball-carpool"
VOLUME /home/node/.config/byteball-carpool
EXPOSE 5180

ENV DEBUG="express:*"
ENV IP="0.0.0.0"
ENV PORT="5180"

ENTRYPOINT ["node", "--max-old-space-size=4000"]
CMD ["carpool.js"]
