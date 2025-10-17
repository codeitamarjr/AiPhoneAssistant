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



# Appointments API

GET /api/appointments/next?listing_id=42

200 OK
{
  "slot_id": 17,
  "viewing_slot_id": 17,
  "mode": "staggered",
  "interval_minutes": 10,
  "scheduled_at": "2025-10-06T10:20:00+00:00",
  "available_from": "2025-10-06T10:00:00+00:00",
  "available_until": "2025-10-06T10:30:00+00:00",
  "capacity": 6,
  "booked": 2,
  "remaining": 4,
  "listing": {
    "id": 42,
    "title": "Oakview 2B",
    "address": "12 Oakview Road",
    "postcode": "D02"
  }
}
POST /api/appointments
{
  "viewing_slot_id": 17,
  "name": "Jamie Lee",
  "phone": "+353861234567",
  "email": "jamie@example.com"
}

201 Created
{
  "id": 311,
  "slot_id": 17,
  "listing_id": 42,
  "name": "Jamie Lee",
  "phone": "+353861234567",
  "email": "jamie@example.com",
  "scheduled_at": "2025-10-06T10:20:00+00:00",
  "slot": {
    "id": 17,
    "mode": "staggered",
    "start_at": "2025-10-06T10:00:00+00:00",
    "interval_minutes": 10,
    "capacity": 6,
    "booked": 3,
    "remaining": 3,
    "listing": {
      "id": 42,
      "title": "Oakview 2B",
      "address": "12 Oakview Road",
      "postcode": "D02"
    }
  }
}
PATCH /api/appointments/311
{
  "phone": "+353899998888",
  "viewing_slot_id": 18
}

200 OK
{
  "id": 311,
  "slot_id": 18,
  "listing_id": 42,
  "name": "Jamie Lee",
  "phone": "+353899998888",
  "email": "jamie@example.com",
  "scheduled_at": "2025-10-06T11:05:00+00:00",
  "slot": {
    "id": 18,
    "mode": "staggered",
    "start_at": "2025-10-06T11:00:00+00:00",
    "interval_minutes": 5,
    "capacity": 8,
    "booked": 4,
    "remaining": 4,
    "listing": {
      "id": 42,
      "title": "Oakview 2B",
      "address": "12 Oakview Road",
      "postcode": "D02"
    }
  }
}
// (Use DELETE /api/appointments/{id} if the orchestrator needs to cancel.)