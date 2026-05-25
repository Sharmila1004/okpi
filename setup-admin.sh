#!/bin/bash

# OKPI First Admin Setup Script
# This script helps create the first admin user for OKPI deployment

set -e

echo "======================================"
echo "OKPI First Admin User Setup"
echo "======================================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@okpi.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_FIRST_NAME="${ADMIN_FIRST_NAME:-System}"
ADMIN_LAST_NAME="${ADMIN_LAST_NAME:-Administrator}"

# Check if API is available
echo "Checking API availability at $API_URL..."
if ! curl -s "$API_URL/api/v1/auth/users" > /dev/null 2>&1; then
    echo "❌ API is not available at $API_URL"
    echo "Please ensure OKPI services are running:"
    echo "  docker-compose up -d"
    exit 1
fi
echo "✅ API is available"
echo ""

# Get or prompt for admin password
if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Enter a strong password for the admin user:"
    read -s ADMIN_PASSWORD
    echo "Confirm password:"
    read -s ADMIN_PASSWORD_CONFIRM
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo "❌ Passwords do not match"
        exit 1
    fi
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Password cannot be empty"
    exit 1
fi

echo ""
echo "Creating admin user..."
echo "  Email: $ADMIN_EMAIL"
echo "  Name: $ADMIN_FIRST_NAME $ADMIN_LAST_NAME"
echo ""

# Register the user
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"$ADMIN_FIRST_NAME\",
    \"lastName\": \"$ADMIN_LAST_NAME\"
  }")

USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$USER_ID" ]; then
    echo "❌ Failed to create user"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

echo "✅ User created with ID: $USER_ID"
echo ""

# Login to get token
echo "Logging in to get access token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to login"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Promote to admin
echo "Promoting user to ADMIN role..."
ROLE_RESPONSE=$(curl -s -X PUT "$API_URL/api/v1/auth/users/$USER_ID/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "ADMIN"
  }')

ROLE=$(echo "$ROLE_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)

if [ "$ROLE" != "ADMIN" ]; then
    echo "❌ Failed to promote user to admin"
    echo "Response: $ROLE_RESPONSE"
    exit 1
fi

echo "✅ User promoted to ADMIN"
echo ""

echo "======================================"
echo "✅ Admin setup complete!"
echo "======================================"
echo ""
echo "Login credentials:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: (the password you entered)"
echo ""
echo "Next steps:"
echo "1. Open the application at: http://localhost:3000"
echo "2. Login with the above credentials"
echo "3. Create more users through the admin interface"
echo ""
