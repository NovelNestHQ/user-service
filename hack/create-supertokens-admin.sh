#!/bin/bash

SUPERTOKENS_URL="http://localhost:3567"
ADMIN_EMAIL="admin@novelnest.com"
ADMIN_PASSWORD="password123"  # Must be at least 8 chars, with one letter and one number

echo "🔄 Waiting for SuperTokens to be ready at $SUPERTOKENS_URL..."

# Wait until SuperTokens is ready
until curl -s "$SUPERTOKENS_URL/hello" >/dev/null; do
  sleep 2
done

echo "✅ SuperTokens is up. Creating admin user..."

RESPONSE=$(curl --silent --write-out 'HTTPSTATUS:%{http_code}' --location --request POST "$SUPERTOKENS_URL/recipe/dashboard/user" \
  --header "rid: dashboard" \
  --header "Content-Type: application/json" \
  --data-raw "{\"email\": \"$ADMIN_EMAIL\",\"password\": \"$ADMIN_PASSWORD\"}")

BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$STATUS" -eq 200 ]; then
    if echo "$BODY" | grep -q "EMAIL_ALREADY_EXISTS_ERROR"; then
        echo "ℹ️  Admin user already exists. Skipping creation."
    else
        echo "✅ Admin user created successfully."
    fi
elif echo "$BODY" | grep -q "PASSWORD_WEAK_ERROR"; then
  # Extract and print the 'message' field manually
  MESSAGE=$(echo "$BODY" | sed -n 's/.*"message":"\([^"]*\)".*/\1/p')
  echo "⚠️ Password is too weak. Reason: $MESSAGE"
  exit 1
else
  echo "❌ Failed to create admin user. Unexpected response:"
  echo "$BODY"
  exit 1
fi
