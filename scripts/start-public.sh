#!/bin/bash
# =====================================================
# P2P Collab - 외부 접속 실행 스크립트
# 폰/외부에서도 접속할 수 있는 공개 URL을 생성합니다.
# =====================================================

echo ""
echo "🚀 P2P Collab 외부 접속 설정"
echo "============================="
echo ""

# 1) Next.js 서버 시작
echo "[1/2] Next.js 서버 시작 중..."
npx next dev -H 0.0.0.0 -p 3000 &
NEXT_PID=$!
sleep 5

# 2) 터널링 방법 선택
echo ""
echo "[2/2] 터널링 서비스로 공개 URL 생성 중..."
echo ""

# 방법 A: npx localtunnel (설치 불필요)
if command -v npx &> /dev/null; then
  echo "📡 localtunnel 시작..."
  echo ""
  npx localtunnel --port 3000
fi

# 서버가 종료되면 정리
kill $NEXT_PID 2>/dev/null
echo ""
echo "서버가 종료되었습니다."
