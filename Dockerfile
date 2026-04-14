# ---- 1단계: deps ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

# ---- 2단계: build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 클라이언트 생성
RUN yarn prisma generate

# Next.js 빌드
RUN yarn build

# 커스텀 서버(Socket.io) TypeScript 컴파일
RUN yarn tsc --project tsconfig.server.json

# ---- 3단계: runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# SSH 설치 및 root 로그인 허용
RUN apk add --no-cache openssh \
    && sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

# 실행에 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000 22

CMD ["/entrypoint.sh"]
