import { useState } from 'react';
import axios from 'axios';

export default function ConnectTwilioStep({ group, onDone }:{ group:any; onDone:()=>void }) {
  const [form, setForm] = useState({
    account_sid: '',
    auth_token: '',
    incoming_phone_e164: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await axios.post(`/api/v1/groups/${group.id}/twilio`, form);
    setSaving(false);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <h2 className="text-xl font-medium">Connect Twilio</h2>
      <input className="w-full border rounded px-3 py-2"
        placeholder="Account SID (AC…)" value={form.account_sid}
        onChange={e=>setForm({...form, account_sid: e.target.value})}/>
      <input className="w-full border rounded px-3 py-2"
        placeholder="Auth Token" type="password" value={form.auth_token}
        onChange={e=>setForm({...form, auth_token: e.target.value})}/>
      <input className="w-full border rounded px-3 py-2"
        placeholder="Phone (+353…)" value={form.incoming_phone_e164}
        onChange={e=>setForm({...form, incoming_phone_e164: e.target.value})}/>
      <p className="text-xs text-gray-500">
        We store your Twilio token encrypted. You can rotate or revoke it anytime.
      </p>
      <button className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
              disabled={saving || !form.account_sid || !form.auth_token}>
        {saving ? 'Saving…' : 'Save & Continue'}
      </button>
    </form>
  );
}
