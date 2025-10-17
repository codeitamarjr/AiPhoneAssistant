# AI Phone Assistant Orchestrator

> **Twilio SIP → OpenAI Realtime → Node.js → Laravel CRM**
>
> This service orchestrates real-time phone calls between Twilio and the AI Phone Assistant. It receives SIP calls, streams audio to OpenAI’s realtime API, watches for webhook updates, and syncs call activity / leads back into the Laravel CRM.

---

## 📦 What’s in the box?

```
ai-orchestrator/
├── src/
│   ├── index.js    # Express app + webhook handler + realtime bridge
│   └── crm.js      # Axios client helper for the CRM API
├── package.json
├── package-lock.json
└── README.MD
```

- **Express webhook server** with raw body parsing for OpenAI signature verification.
- **Realtime bridge** that listens to OpenAI’s Realtime API and pushes events to Twilio.
- **CRM client** to post call starts/ends and captured lead data to the Laravel backend.
- **Structured JSON logger** (`logj`) with adjustable log levels via `LOG_LEVEL`.
- **Dev tooling** powered by `concurrently` and `ngrok` for quick tunnelling.

---

## 🚀 Quick start

> Requires Node.js 20+. Clone the repository, then set up the orchestrator app:

```bash
cd apps/ai-orchestrator
npm install
cp .env.example .env      # Create and edit your environment file
```

Start the server locally:

```bash
npm run dev            # Node in watch mode (default port 5050)
```

Or run with an ngrok tunnel for Twilio / OpenAI webhooks:

```bash
npm run dev:tunneled   # Runs both the dev server and ngrok (http://localhost:5050)
```

### Sample request

Once it’s running, try a health check:

```bash
curl -s http://localhost:5050/ | jq
```

If you’re using the tunnel (`npm run dev:tunneled`), the ngrok URL is printed in the terminal—use that in Twilio / OpenAI console settings.

---

## ⚙️ Configuration

Create `.env` and supply the following variables:

```bash
PORT=5050
OPENAI_API_KEY=sk-proj-...
OPENAI_WEBHOOK_SECRET=whsec-...
REALTIME_MODEL=gpt-realtime
REALTIME_VOICE=alloy

# CRM integration
dCRM_BASE_URL=https://ai-phoneassistant.test
CRM_TOKEN=your-crm-api-token

# Optional
dLOG_LEVEL=debug # debug | info | warn | error
```

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Server-side key with access to the Realtime API. |
| `OPENAI_WEBHOOK_SECRET` | Webhook secret for verifying incoming OpenAI requests. |
| `REALTIME_MODEL` | OpenAI realtime model (defaults to `gpt-realtime`). |
| `REALTIME_VOICE` | Voice persona (defaults to `alloy`). |
| `CRM_BASE_URL` | Base URL of the Laravel CRM (e.g., your Valet site). |
| `CRM_TOKEN` | Bearer token to authenticate with the CRM API (stored in the CRM admin). |
| `LOG_LEVEL` | Controls verbosity of the JSON logger. |

> **Note:** Never commit real credentials. The `.env` file is ignored by git.

---

## 🔌 How it works

1. **Twilio SIP** routes calls to the OpenAI Realtime connector (`gpt-audio-mini`).
2. **OpenAI** sends events to our orchestrator webhooks (`/webhooks/openai`).
3. The **Node.js orchestrator**:
   - Validates webhook signatures.
   - Streams audio back to Twilio in realtime.
   - Logs call start/end events to the CRM.
   - Creates CRM leads when callers share contact details.
4. The **Laravel CRM** stores call logs, listings, and lead data for follow-up.

The high-level flow:

```
Twilio SIP number
    ↓
OpenAI Realtime SIP Connector
    ↓
Node.js Orchestrator (this project)
    ↓
Laravel CRM (logs, leads, property data)
```

---

## 🧪 Testing & troubleshooting

- **Local ngrok tunnel**: `npm run dev:tunneled`
- **Check logs**: Run the orchestrator with `LOG_LEVEL=debug` to see detailed JSON logs.
- **Replay requests**: Use the sample curl command or the Twilio console to send test calls.
- **SMTP / email**: Not handled by the orchestrator; report leads to the CRM which triggers emails.

If you encounter signature verification errors, ensure the `OPENAI_WEBHOOK_SECRET` matches the value in your OpenAI dashboard.

---

## 🔐 Deployment notes

- Deploy behind HTTPS (ngrok, Cloudflare tunnel, or your own proxy).
- Provision environment variables securely (e.g., `.env` files, AWS/GCP secret managers).
- Ensure the CRM API token is scoped appropriately; rotate it if the orchestrator logs show unauthorized responses.
- Use a process manager (`pm2`, `systemd`, Docker) for production and keep logs centralised.

---

## 🤝 Contributing

Pull requests are welcome! If you’re adding new connectors or providers, follow these guidelines:

1. Open an issue first to describe the enhancement.
2. Write the change with clear logging (`logj` levels) and error handling.
3. Update this README with any new configuration or setup steps.

---

## 📝 License

This project is proprietary and not distributed under an open-source license. Contact the maintainers for usage terms.

