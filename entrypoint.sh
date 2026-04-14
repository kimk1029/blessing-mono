#!/bin/sh
set -e

# SSH 호스트 키 생성 (없을 경우에만)
ssh-keygen -A

# SSH 비밀번호 설정 (환경변수로 주입, 기본값 제공)
echo "root:${SSH_PASSWORD:-changeme}" | chpasswd

# sshd 백그라운드 실행
/usr/sbin/sshd

# 앱 실행
exec node dist/server.js
