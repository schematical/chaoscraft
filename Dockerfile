FROM node:4.2
# replace this with your application's default port
WORKDIR /app
COPY . .
RUN npm i --unsafe-perm
EXPOSE 3000
VOLUME /content
RUN tsc
CMD node dist/app.js