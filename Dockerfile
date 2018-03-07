FROM node:6.9.1
# replace this with your application's default port
WORKDIR /app
COPY ./tsconfig.json .
COPY ./package.json .
COPY ./src ./src
COPY ./config ./config
#RUN ls -la ./node_modules/
RUN npm i --unsafe-perm
RUN npm i typescript
#RUN ls -la ./node_modules/chaoscraft-shared
RUN node ./node_modules/typescript/bin/tsc
RUN npm uninstall typescript
#EXPOSE 3000
VOLUME /content
CMD node dist/index.js