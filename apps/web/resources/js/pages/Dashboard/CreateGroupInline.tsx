import { useState } from 'react';
import axios from 'axios';

export default function CreateGroupInline({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await axios.post('/api/v1/groups', { name });
    setSaving(false);
    onCreated?.();
  };
  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <label className="block text-sm font-medium">Group name</label>
      <input className="w-full border rounded px-3 py-2" value={name}
             onChange={e=>setName(e.target.value)} placeholder="e.g., Real Enquiries Ltd" />
      <button className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
              disabled={!name || saving}>
        {saving ? 'Creating…' : 'Create Group'}
      </button>
    </form>
  );
}
