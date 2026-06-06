#!/bin/bash

set -e

echo "=========================================="
echo "高校科研经费报销预审系统 - Docker启动"
echo "=========================================="

echo ""
echo "[1/3] 构建并启动服务..."
docker-compose up -d --build

echo ""
echo "[2/3] 等待服务启动..."
sleep 15

echo ""
echo "[3/3] 健康检查..."
if curl -s http://localhost:3001/api/health | grep -q "success"; then
    echo "✓ 后端服务正常"
else
    echo "⚠ 后端服务可能还在启动中，请稍后检查"
fi

echo ""
echo "=========================================="
echo "Docker 启动完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:3001/api"
echo ""
echo "运行验收测试："
echo "  docker-compose run --rm test-runner"
echo ""
echo "停止服务："
echo "  docker-compose down"
echo ""
