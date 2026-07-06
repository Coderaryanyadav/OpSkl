import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bjgmrkjykcjpthkjpnlh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
);

interface Gig {
  id: string;
  title: string;
  category: string;
  budget_amount: number;
  status: string;
  client_id: string;
  created_at: string;
}

export default function GigsAdmin() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gigs')
      .select('id, title, category, budget_amount, status, client_id, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGigs(data);
    }
    setLoading(false);
  };

  const handleCancelGig = async (gigId: string) => {
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'cancelled' })
      .eq('id', gigId);

    if (!error) {
      fetchGigs();
    }
  };

  return (
    <div className="flex bg-darkBg text-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Gig Moderation Panel</h1>
          <p className="text-gray-400 mt-1">Audit active requirement postings and enforce platform safety rules.</p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading requirement feeds...</div>
        ) : (
          <div className="bg-darkCard border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Gig Requirement</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Post Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Moderator Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {gigs.map((gig) => (
                  <tr key={gig.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{gig.title}</td>
                    <td className="px-6 py-4 text-gray-400">{gig.category}</td>
                    <td className="px-6 py-4 font-semibold text-green-500">₹{gig.budget_amount}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(gig.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        gig.status === 'open'
                          ? 'bg-green-600/10 text-green-400 border border-green-800/30'
                          : gig.status === 'cancelled'
                          ? 'bg-red-600/10 text-red-400 border border-red-800/30'
                          : 'bg-gray-900 text-gray-400 border border-gray-800'
                      }`}>
                        {gig.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {gig.status === 'open' && (
                        <button
                          onClick={() => handleCancelGig(gig.id)}
                          className="px-3 py-1.5 bg-red-600/20 border border-red-700/30 text-red-400 hover:bg-red-600 hover:text-white rounded-md text-xs font-semibold transition-colors"
                        >
                          Cancel / Take Down
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gigs.length === 0 && (
              <div className="text-center py-20 text-gray-500">No active gigs posted.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
