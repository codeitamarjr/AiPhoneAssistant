## Call Orchestrator 2.0

### Overview
Call Orchestrator 2.0 is a Fastify-based application that serves as a backend for handling calls and interactions with the OpenAI API.
### Prerequisites
  
# Package Installation
 npm install fastify ws dotenv @fastify/formbody @fastify/websocket

 ngrok http 5050

 ## Testing Orchestratos API
 curl -X POST "http://localhost:5050/incoming-call" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=+353899990001" \
  --data-urlencode "To=+19126008863" \
  --data-urlencode "CallSid=CA_test_12345" \
  --data-urlencode "Caller=Test Caller"

  curl -s \
  -H "Authorization: Bearer "$Token" \
  -H "X-Api-Token: "$Token" \
  "https://ai-phoneassistant.test/api/listings/by-number?to_e164=+19126008863" | jq