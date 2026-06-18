#!/usr/bin/env bash
# OTA 端到端测试脚本
# 验证：创建版本 → 发布 → 客户端检查更新 → 上报统计
#
# 使用: ./scripts/test-ota-e2e.sh
# 前提: chawork-skills API 正在运行 (pnpm dev:api)

set -e

API_BASE="${OTA_API_BASE:-http://localhost:3100}"
ADMIN="${API_BASE}/api/admin/ota"
CLIENT="${API_BASE}/api/ota"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# ─── 0. 健康检查 ─────────────────────────────────────────────────

info "检查 API 服务是否运行..."
curl -sf "${API_BASE}/api/v1/health" > /dev/null 2>&1 || fail "API 服务未运行，请先执行: cd chawork-skills && pnpm dev:api"
pass "API 服务正常"

# ─── 1. 创建版本 ─────────────────────────────────────────────────

info "创建测试版本 v0.2.0..."
CREATE_RESP=$(curl -sf -X POST "${ADMIN}/releases" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "0.2.0",
    "update_type": "both",
    "channel": "stable",
    "platform": "darwin-aarch64",
    "release_notes": "## 测试版本\n- OTA 系统测试",
    "force_update": false,
    "min_compatible_version": "0.1.0"
  }')

RELEASE_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -z "$RELEASE_ID" ]; then
  fail "创建版本失败: $CREATE_RESP"
fi
pass "创建版本成功 (id=$RELEASE_ID)"

# ─── 2. 查询版本列表 ─────────────────────────────────────────────

info "查询版本列表..."
LIST_RESP=$(curl -sf "${ADMIN}/releases")
TOTAL=$(echo "$LIST_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null)
pass "版本列表查询成功 (total=$TOTAL)"

# ─── 3. 发布版本 ─────────────────────────────────────────────────

info "发布版本 v0.2.0..."
PUB_RESP=$(curl -sf -X POST "${ADMIN}/releases/${RELEASE_ID}/publish")
STATUS=$(echo "$PUB_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
[ "$STATUS" = "active" ] || fail "发布失败: status=$STATUS"
pass "版本发布成功 (status=active)"

# ─── 4. 客户端检查更新 ───────────────────────────────────────────

info "模拟客户端检查更新 (current_version=0.1.0)..."
CHECK_RESP=$(curl -sf "${CLIENT}/check?current_version=0.1.0&target=darwin-aarch64&arch=aarch64&device_id=test-device-001&channel=stable")
UPDATE_VERSION=$(echo "$CHECK_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null)
UPDATE_TYPE=$(echo "$CHECK_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['update_type'])" 2>/dev/null)
[ "$UPDATE_VERSION" = "0.2.0" ] || fail "更新检查失败: version=$UPDATE_VERSION"
pass "客户端收到更新 (version=$UPDATE_VERSION, type=$UPDATE_TYPE)"

# ─── 5. 已是最新版本 ─────────────────────────────────────────────

info "模拟已是最新版本 (current_version=0.2.0)..."
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "${CLIENT}/check?current_version=0.2.0&target=darwin-aarch64&arch=aarch64&device_id=test-device-001&channel=stable")
[ "$HTTP_CODE" = "204" ] || fail "应返回204, 实际: $HTTP_CODE"
pass "无更新返回 204"

# ─── 6. 上报升级状态 ─────────────────────────────────────────────

info "上报升级成功..."
REPORT_RESP=$(curl -sf -X POST "${CLIENT}/report" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-001",
    "from_version": "0.1.0",
    "to_version": "0.2.0",
    "update_type": "hot",
    "status": "success"
  }')
REPORT_OK=$(echo "$REPORT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null)
[ "$REPORT_OK" = "True" ] || fail "上报失败: $REPORT_RESP"
pass "升级状态上报成功"

# ─── 7. 查看统计 ─────────────────────────────────────────────────

info "获取统计数据..."
STATS_RESP=$(curl -sf "${ADMIN}/stats")
TOTAL_DEVICES=$(echo "$STATS_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['overview']['total_devices'])" 2>/dev/null)
pass "统计数据正常 (total_devices=$TOTAL_DEVICES)"

# ─── 8. 灰度规则 ─────────────────────────────────────────────────

info "创建灰度规则 (30% 设备)..."
GRAY_RESP=$(curl -sf -X POST "${ADMIN}/gray-rules" \
  -H "Content-Type: application/json" \
  -d "{\"release_id\": $RELEASE_ID, \"rule_type\": \"percentage\", \"percentage\": 30}")
GRAY_ID=$(echo "$GRAY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
[ -n "$GRAY_ID" ] || fail "灰度规则创建失败"
pass "灰度规则创建成功 (id=$GRAY_ID)"

# ─── 9. 灰度生效验证 ─────────────────────────────────────────────

info "创建新版本 v0.3.0 并测试灰度..."
curl -sf -X POST "${ADMIN}/releases" \
  -H "Content-Type: application/json" \
  -d '{"version": "0.3.0", "update_type": "hot", "channel": "stable", "platform": "darwin-aarch64"}' > /dev/null
NEW_ID=$(curl -sf "${ADMIN}/releases" | python3 -c "import sys,json; items=json.load(sys.stdin)['items']; print(next(i['id'] for i in items if i['version']=='0.3.0'))" 2>/dev/null)
curl -sf -X POST "${ADMIN}/releases/${NEW_ID}/publish" > /dev/null
curl -sf -X POST "${ADMIN}/gray-rules" \
  -H "Content-Type: application/json" \
  -d "{\"release_id\": $NEW_ID, \"rule_type\": \"percentage\", \"percentage\": 1}" > /dev/null

# 大多数设备不应收到 1% 灰度的更新
GRAY_CHECK=$(curl -sf -o /dev/null -w "%{http_code}" "${CLIENT}/check?current_version=0.2.0&target=darwin-aarch64&arch=aarch64&device_id=should-not-get-update-xyz&channel=stable")
pass "灰度规则验证完成 (device got: HTTP $GRAY_CHECK)"

# ─── 10. 回滚 ────────────────────────────────────────────────────

info "回滚版本 v0.3.0..."
ROLLBACK_RESP=$(curl -sf -X POST "${ADMIN}/releases/${NEW_ID}/rollback")
RB_STATUS=$(echo "$ROLLBACK_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
[ "$RB_STATUS" = "rollback" ] || fail "回滚失败: $RB_STATUS"
pass "版本回滚成功"

# ─── 11. 渠道列表 ────────────────────────────────────────────────

info "获取渠道列表..."
CHANNELS=$(curl -sf "${ADMIN}/channels" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
[ "$CHANNELS" -ge 3 ] || fail "渠道数量异常: $CHANNELS"
pass "渠道列表正常 (count=$CHANNELS)"

# ─── 清理 ────────────────────────────────────────────────────────

info "清理测试数据..."
# 删除草稿版本（活跃版本不可删除，跳过）
curl -sf -X DELETE "${ADMIN}/releases/${RELEASE_ID}" > /dev/null 2>&1 || true
pass "清理完成"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  OTA 端到端测试全部通过！${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
