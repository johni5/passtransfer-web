FROM alpine
EXPOSE 7000
EXPOSE 443
WORKDIR /app
RUN apk add --update npm
COPY . .
RUN npm ci
ENV CMD_RUN=start
ENTRYPOINT ["sh", "-c", "npm run ${CMD_RUN}"]
#CMD npm run start
