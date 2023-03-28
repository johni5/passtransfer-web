FROM alpine
EXPOSE 7000
EXPOSE 443
WORKDIR /app
RUN apk add --update npm
COPY . .
RUN npm ci
CMD npm run start
