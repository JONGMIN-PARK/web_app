#!/bin/bash
# =====================================================
# P2P Collab - ngrok을 이용한 외부 접속 스크립트
#
# 사전 준비:
#   1. https://ngrok.com 에서 무료 가입
#   2. ngrok 설치: brew install ngrok (Mac) 또는 https://ngrok.com/download
#   3. 인증: ngrok config add-authtoken <YOUR_TOKEN>
# =====================================================

echo ""
echo "🚀 P2P Collab - ngrok 외부 접속"
echo "================================"
echo ""

# ngrok 설치 확인
if ! command -v ngrok &> /dev/null; then
  echo "❌ ngrok이 설치되어 있지 않습니다."
  echo ""
  echo "설치 방법:"
  echo "  Mac:     brew install ngrok"
  echo "  Linux:   snap install ngrok"
  echo "  Windows: https://ngrok.com/download"
  echo ""
  echo "설치 후 인증:"
  echo "  ngrok config add-authtoken <YOUR_TOKEN>"
  echo "  (토큰은 https://dashboard.ngrok.com/get-started/your-authtoken)"
  exit 1
fi

# Next.js 서버 시작
echo "[1/2] Next.js 서버 시작 중..."
npx next dev -H 0.0.0.0 -p 3000 &
NEXT_PID=$!
sleep 5
echo "✅ 서버 시작 완료 (localhost:3000)"
echo ""

# ngrok 터널 시작
echo "[2/2] ngrok 터널 생성 중..."
echo ""
ngrok http 3000

# 종료 시 정리
kill $NEXT_PID 2>/dev/null
echo "서버가 종료되었습니다."
