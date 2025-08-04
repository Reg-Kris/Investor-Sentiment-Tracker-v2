#!/bin/bash

# Monitoring System Validation Script
# This script validates all monitoring components are working correctly

set -e

echo "🔍 Validating Monitoring & Alerting System"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://$(git config remote.origin.url | sed 's/.*github.com[:/]\([^/]*\)\/\([^.]*\).*/\1.github.io\/\2/')/"
if [[ "$BASE_URL" == "https://.github.io//" ]]; then
    echo "⚠️  Cannot determine GitHub Pages URL. Please set BASE_URL manually."
    BASE_URL="http://localhost:3000/"  # Fallback for local testing
fi

echo "🌐 Testing URL: $BASE_URL"
echo ""

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Helper functions
test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test HTTP endpoint
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local test_name="$3"
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        test_passed "$test_name (HTTP $response)"
        return 0
    else
        test_failed "$test_name (Expected HTTP $expected_status, got $response)"
        return 1
    fi
}

# Test JSON response structure
test_json_structure() {
    local file="$1"
    local jq_filter="$2"
    local test_name="$3"
    
    if [[ -f "$file" ]]; then
        local result=$(jq -r "$jq_filter" "$file" 2>/dev/null || echo "null")
        if [[ "$result" != "null" && "$result" != "" ]]; then
            test_passed "$test_name"
            return 0
        fi
    fi
    
    test_failed "$test_name"
    return 1
}

echo "🏥 Testing Health Check Endpoints"
echo "--------------------------------"

# Basic health check
if test_endpoint "${BASE_URL}api/health" "200" "Basic Health Check"; then
    test_json_structure "/tmp/response.json" ".status" "Health Status Field"
    test_json_structure "/tmp/response.json" ".timestamp" "Health Timestamp Field"
    test_json_structure "/tmp/response.json" ".services" "Health Services Field"
fi

echo ""

# Detailed health check
if test_endpoint "${BASE_URL}api/health/detailed" "200" "Detailed Health Check"; then
    test_json_structure "/tmp/response.json" ".dependencies" "Health Dependencies Field"
    test_json_structure "/tmp/response.json" ".environment" "Health Environment Field"
    test_json_structure "/tmp/response.json" ".performance" "Health Performance Field"
fi

echo ""
echo "📊 Testing Metrics Endpoints"
echo "----------------------------"

# Metrics endpoint
if test_endpoint "${BASE_URL}api/metrics" "200" "Metrics Endpoint"; then
    test_json_structure "/tmp/response.json" ".application" "Metrics Application Field"
    test_json_structure "/tmp/response.json" ".http" "Metrics HTTP Field"
    test_json_structure "/tmp/response.json" ".system" "Metrics System Field"
fi

echo ""
echo "📝 Testing Logging Endpoints"
echo "----------------------------"

# Logs endpoint (GET)
if test_endpoint "${BASE_URL}api/logs" "200" "Logs Retrieval"; then
    test_json_structure "/tmp/response.json" ".logs" "Logs Array Field"
    test_json_structure "/tmp/response.json" ".statistics" "Logs Statistics Field"
fi

# Test log submission (POST)
echo ""
test_info "Testing log submission..."
log_payload='{
  "logs": [
    {
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "level": "info",
      "message": "Monitoring validation test",
      "context": {"test": true}
    }
  ]
}'

log_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$log_payload" \
    -o /tmp/log_response.json \
    "${BASE_URL}api/logs" 2>/dev/null || echo "000")

if [[ "$log_response" == "200" ]]; then
    test_passed "Log Submission (HTTP $log_response)"
    test_json_structure "/tmp/log_response.json" ".success" "Log Response Success Field"
else
    test_failed "Log Submission (Expected HTTP 200, got $log_response)"
fi

echo ""
echo "⚡ Testing Performance Endpoints"
echo "------------------------------"

# Performance endpoint (GET)
if test_endpoint "${BASE_URL}api/performance" "200" "Performance Metrics Retrieval"; then
    test_json_structure "/tmp/response.json" ".data" "Performance Data Field"
    test_json_structure "/tmp/response.json" ".statistics" "Performance Statistics Field"
fi

# Test performance data submission (POST)
echo ""
test_info "Testing performance data submission..."
perf_payload='{
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "url": "test-url",
  "userAgent": "monitoring-test",
  "connectionType": "4g",
  "metrics": {
    "navigation": {
      "loadComplete": 1500,
      "domContentLoaded": 800,
      "timeToFirstByte": 200
    },
    "resources": {
      "totalSize": 1024,
      "resourceCount": 10,
      "slowestResource": "test.js",
      "slowestResourceTime": 300
    },
    "vitals": {
      "lcp": 1200,
      "fid": 50,
      "cls": 0.05
    }
  },
  "warnings": []
}'

perf_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$perf_payload" \
    -o /tmp/perf_response.json \
    "${BASE_URL}api/performance" 2>/dev/null || echo "000")

if [[ "$perf_response" == "200" ]]; then
    test_passed "Performance Data Submission (HTTP $perf_response)"
    test_json_structure "/tmp/perf_response.json" ".success" "Performance Response Success Field"
else
    test_failed "Performance Data Submission (Expected HTTP 200, got $perf_response)"
fi

echo ""
echo "🔗 Testing External API Dependencies"
echo "-----------------------------------"

# Test Fear & Greed Index API
echo ""
test_info "Testing Fear & Greed Index API..."
fng_response=$(curl -s -w "%{http_code}" -o /tmp/fng_response.json "https://api.alternative.me/fng/" 2>/dev/null || echo "000")

if [[ "$fng_response" == "200" ]]; then
    test_passed "Fear & Greed Index API (HTTP $fng_response)"
    if command -v jq &> /dev/null; then
        fng_value=$(jq -r '.data[0].value' /tmp/fng_response.json 2>/dev/null || echo "null")
        if [[ "$fng_value" != "null" && "$fng_value" =~ ^[0-9]+$ ]]; then
            test_passed "Fear & Greed Index Data Valid (Value: $fng_value)"
        else
            test_warning "Fear & Greed Index Data Invalid"
        fi
    fi
else
    test_warning "Fear & Greed Index API (HTTP $fng_response) - May affect data quality"
fi

# Test Yahoo Finance API
echo ""
test_info "Testing Yahoo Finance API..."
yahoo_response=$(curl -s -w "%{http_code}" -o /tmp/yahoo_response.json \
    "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d" 2>/dev/null || echo "000")

if [[ "$yahoo_response" == "200" ]]; then
    test_passed "Yahoo Finance API (HTTP $yahoo_response)"
    if command -v jq &> /dev/null; then
        yahoo_price=$(jq -r '.chart.result[0].indicators.quote[0].close[0]' /tmp/yahoo_response.json 2>/dev/null || echo "null")
        if [[ "$yahoo_price" != "null" && "$yahoo_price" =~ ^[0-9]+\.?[0-9]*$ ]]; then
            test_passed "Yahoo Finance Data Valid (SPY: \$${yahoo_price})"
        else
            test_warning "Yahoo Finance Data Invalid"
        fi
    fi
else
    test_warning "Yahoo Finance API (HTTP $yahoo_response) - May affect data quality"
fi

echo ""
echo "🛠  Testing GitHub Actions Workflows"
echo "----------------------------------"

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    # Check recent workflow runs
    echo ""
    test_info "Checking recent workflow runs..."
    
    # Check if we're in a git repo
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # Get recent runs
        recent_runs=$(gh run list --limit 5 --json status,conclusion,workflowName 2>/dev/null || echo "[]")
        
        if [[ "$recent_runs" != "[]" ]]; then
            test_passed "GitHub Actions Accessible"
            
            # Check for failed runs
            failed_runs=$(echo "$recent_runs" | jq -r '.[] | select(.conclusion == "failure") | .workflowName' 2>/dev/null || echo "")
            
            if [[ -n "$failed_runs" ]]; then
                test_warning "Recent workflow failures detected: $failed_runs"
            else
                test_passed "No recent workflow failures"
            fi
        else
            test_warning "Cannot access recent workflow runs"
        fi
    else
        test_warning "Not in a Git repository - cannot check workflows"
    fi
else
    test_warning "GitHub CLI not available - cannot check workflow status"
fi

# Check workflow files exist
echo ""
test_info "Checking workflow files..."

workflow_files=(
    ".github/workflows/deploy.yml"
    ".github/workflows/monitoring.yml"
    ".github/workflows/rate-limit-monitoring.yml"
)

for workflow in "${workflow_files[@]}"; do
    if [[ -f "$workflow" ]]; then
        test_passed "Workflow file exists: $(basename "$workflow")"
    else
        test_failed "Missing workflow file: $workflow"
    fi
done

echo ""
echo "📁 Testing Documentation"
echo "-----------------------"

# Check documentation files
doc_files=(
    "MONITORING.md"
    "RUNBOOK.md"
    "MONITORING_CHECKLIST.md"
)

for doc in "${doc_files[@]}"; do
    if [[ -f "$doc" ]]; then
        test_passed "Documentation exists: $doc"
    else
        test_failed "Missing documentation: $doc"
    fi
done

echo ""
echo "🧹 Cleanup"
echo "---------"

# Clean up temporary files
rm -f /tmp/response.json /tmp/log_response.json /tmp/perf_response.json
rm -f /tmp/fng_response.json /tmp/yahoo_response.json
test_passed "Cleaned up temporary files"

echo ""
echo "📋 Validation Summary"
echo "===================="
echo ""

total_tests=$((TESTS_PASSED + TESTS_FAILED))
pass_percentage=0

if [[ $total_tests -gt 0 ]]; then
    pass_percentage=$(( (TESTS_PASSED * 100) / total_tests ))
fi

echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${BLUE}📊 Pass Rate: $pass_percentage%${NC}"
echo ""

# Final assessment
if [[ $TESTS_FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}🎉 EXCELLENT: All monitoring systems are fully operational!${NC}"
        exit 0
    else
        echo -e "${YELLOW}✅ GOOD: Core monitoring systems operational with minor warnings.${NC}"
        exit 0
    fi
elif [[ $pass_percentage -ge 80 ]]; then
    echo -e "${YELLOW}⚠️  ACCEPTABLE: Most monitoring systems operational, but issues need attention.${NC}"
    exit 1
else
    echo -e "${RED}🚨 CRITICAL: Significant monitoring system failures detected!${NC}"
    exit 2
fi