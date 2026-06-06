#!/bin/bash

set -e

echo "=========================================="
echo "高校科研经费报销预审系统 - 启动脚本"
echo "=========================================="

echo ""
echo "[1/5] 安装后端依赖..."
cd backend
npm install
cd ..

echo ""
echo "[2/5] 安装前端依赖..."
cd frontend
npm install
cd ..

echo ""
echo "[3/5] 初始化数据库..."
cd backend
node src/scripts/initDb.js
cd ..

echo ""
echo "[4/5] 启动后端服务 (端口 4000)..."
cd backend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="后端服务" -- node src/server.js
elif command -v osascript &> /dev/null; then
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && node src/server.js"'
else
    node src/server.js &
    BACKEND_PID=$!
    echo "后端服务 PID: $BACKEND_PID"
fi
cd ..

sleep 3

echo ""
echo "[5/5] 启动前端服务 (端口 3000)..."
cd frontend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="前端服务" -- npm run dev
elif command -v osascript &> /dev/null; then
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && npm run dev"'
else
    npm run dev &
    FRONTEND_PID=$!
    echo "前端服务 PID: $FRONTEND_PID"
fi
cd ..

sleep 3

echo ""
echo "=========================================="
echo "启动完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:3001/api"
echo "  健康检查: http://localhost:3001/api/health"
echo ""
echo "运行验收测试："
echo "  node scripts/acceptance-test.js"
echo ""
