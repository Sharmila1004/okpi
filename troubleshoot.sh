#!/bin/bash

# OKPI Troubleshooting Script

echo "🔍 OKPI Platform Troubleshooting"
echo "=================================="
echo ""

# Check Docker status
echo "1️⃣  Checking Docker containers..."
docker-compose ps
echo ""

# Check if MySQL is accessible
echo "2️⃣  Checking MySQL connections..."
echo "Auth DB:"
mysql -h localhost -P 3307 -u root -proot -e "SELECT 'MySQL Auth connected ✅'" 2>/dev/null || echo "❌ Auth DB not accessible"

echo "Objective DB:"
mysql -h localhost -P 3308 -u root -proot -e "SELECT 'MySQL Objective connected ✅'" 2>/dev/null || echo "❌ Objective DB not accessible"

echo "KPI DB:"
mysql -h localhost -P 3309 -u root -proot -e "SELECT 'MySQL KPI connected ✅'" 2>/dev/null || echo "❌ KPI DB not accessible"

echo ""
echo "3️⃣  Checking service logs..."
echo "Auth Service logs (last 50 lines):"
docker-compose logs --tail=50 auth-service

echo ""
echo "4️⃣  Checking port availability..."
lsof -i :8080 2>/dev/null && echo "✅ Port 8080 in use" || echo "❌ Port 8080 free"
lsof -i :8081 2>/dev/null && echo "✅ Port 8081 in use" || echo "❌ Port 8081 free"
lsof -i :8082 2>/dev/null && echo "✅ Port 8082 in use" || echo "❌ Port 8082 free"
lsof -i :8083 2>/dev/null && echo "✅ Port 8083 in use" || echo "❌ Port 8083 free"

echo ""
echo "5️⃣  Attempting to resolve issues..."
echo "If MySQL is not running, try:"
echo "  docker-compose up -d mysql-auth mysql-objective mysql-kpi"
echo "  sleep 30"
echo "  docker-compose up -d"
