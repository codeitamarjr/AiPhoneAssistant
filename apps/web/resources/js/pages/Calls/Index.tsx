import { Link } from '@inertiajs/react';

export default function CallsIndex({ calls }: { calls: any }) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Received Calls</h1>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">From</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">To</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {calls.data.map((c:any) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.started_at ? new Date(c.started_at).toLocaleString() : '-'}</td>
                <td className="px-3 py-2">{c.from}</td>
                <td className="px-3 py-2">{c.caller_name ?? '—'}</td>
                <td className="px-3 py-2">{c.to}</td>
                <td className="px-3 py-2">{c.status}</td>
                <td className="px-3 py-2 text-right">{c.duration ? `${c.duration}s` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple pagination */}
      <div className="mt-4 flex gap-2">
        {calls.links?.map((l:any, i:number) => (
          <Link
            key={i}
            href={l.url || '#'}
            className={`px-3 py-1 rounded ${l.active ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            dangerouslySetInnerHTML={{ __html: l.label }}
          />
        ))}
      </div>
    </div>
  );
}
