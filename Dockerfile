FROM node:22.13.0-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium ca-certificates fonts-ipafont-gothic fonts-wqy-zenhei fonts-freefont-ttf \
       libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
       libgtk-3-0 libnspr4 libnss3 libu2f-udev libvulkan1 libx11-6 libx11-xcb1 libxcb1 \
       libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=10000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    DATA_DIR=/app/data \
    AUTH_PATH=/app/data/auth \
    BAILEYS_AUTH_PATH=/app/data/.baileys_auth

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/data && chown -R node:node /app

EXPOSE 10000
CMD ["sh", "-c", "chown -R node:node /app/data && exec su -s /bin/sh node -c 'exec node server.js'"]
