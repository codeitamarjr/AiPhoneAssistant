Endpoint
POST /api/leads
Headers:
  Authorization: Bearer {API_TOKEN}
  Content-Type: application/json
Example JSON Payload
{
  "group_id": 1,
  "listing_id": 25,
  "call_log_id": 42,
  "name": "John Doe",
  "phone_e164": "+353871234567",
  "email": "john.doe@example.com",
  "notes": "Interested in 2-bed apartment at Newmarket Square.",
  "status": "contacted"
}
Field Reference
Field	Type	Required	Description
group_id	integer	✅	Must exist in groups table
listing_id	integer	❌	Must exist in listings table if provided
call_log_id	integer	❌	Must exist in call_logs table if provided
name	string	❌	Caller or lead name
phone_e164	string	✅	Caller phone number in E.164 format (+353...)
email	string	❌	Lead email address
notes	string	❌	Optional comments or context
status	enum	❌	One of: new, contacted, qualified, waitlist, rejected (default: new)
Success Response
{
  "ok": true,
  "id": 123
}