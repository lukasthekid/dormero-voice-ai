#!/bin/bash

# Test script for ElevenLabs webhook endpoint
# Usage: ./test-webhook.sh

echo "Testing ElevenLabs webhook endpoint..."
echo ""

# Test webhook with sample payload
curl -X POST http://localhost:3000/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_call_transcription",
    "event_timestamp": 1766655501,
    "data": {
      "agent_id": "agent_4801kda8extdehh9mbak68zhe2y9",
      "conversation_id": "conv_test_123",
      "status": "done",
      "user_id": "u7Of9sd3DEhsTgWR5jTm4lfyOUB2",
      "branch_id": "agtbrch_8501kda8ezd2fjjryk5y8r9fbtmj",
      "transcript": [
        {
          "role": "agent",
          "message": "Hello there, welcome to Dormero Hotels! How can I help you today?",
          "time_in_call_secs": 0
        },
        {
          "role": "user",
          "message": "Hey, I would like to book the hotel over New Year in Vienna.",
          "time_in_call_secs": 4
        }
      ],
      "metadata": {
        "start_time_unix_secs": 1766655472,
        "accepted_time_unix_secs": 1766655472,
        "call_duration_secs": 27,
        "cost": 154,
        "llm_price": 0.00036569999999999994
      },
      "analysis": {
        "call_successful": "success",
        "transcript_summary": "The user wants to book a hotel in Vienna over New Year.",
        "call_summary_title": "Hotel booking in Vienna"
      },
      "main_language": "en",
      "termination_reason": "Client disconnected: 1005"
    }
  }' | jq '.'

echo ""
echo "Test completed!"

