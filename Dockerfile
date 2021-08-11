FROM node:16.6.1

ENV NODE_ENV=production
COPY . .
RUN npm install --production
ENTRYPOINT [ "node", "ftd.js" ]
EXPOSE 8000
