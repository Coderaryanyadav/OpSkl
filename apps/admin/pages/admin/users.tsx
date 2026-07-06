import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bjgmrkjykcjpthkjpnlh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
);

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  is_suspended: boolean;
  is_identity_verified: boolean;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type, is_suspended, is_identity_verified')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleVerify = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_identity_verified: true })
      .eq('id', userId);

    if (!error) {
      fetchUsers();
    }
  };

  const handleSuspend = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: !currentStatus })
      .eq('id', userId);

    if (!error) {
      fetchUsers();
    }
  };

  return (
    <div className="flex bg-darkBg text-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">User Directory Operations</h1>
          <p className="text-gray-400 mt-1">Audit, moderate, and verify profiles on the OpSkl platform.</p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading user profiles...</div>
        ) : (
          <div className="bg-darkCard border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4">Identity Status</th>
                  <th className="px-6 py-4">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{user.full_name}</td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs font-medium text-indigo-400">
                        {user.user_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_identity_verified ? (
                        <span className="text-green-500 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="text-yellow-500 font-medium flex items-center gap-1">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      {!user.is_identity_verified && (
                        <button
                          onClick={() => handleVerify(user.id)}
                          className="px-3 py-1.5 bg-green-600/20 border border-green-700/30 text-green-400 hover:bg-green-600 hover:text-white rounded-md text-xs font-semibold transition-colors"
                        >
                          Verify ID
                        </button>
                      )}
                      <button
                        onClick={() => handleSuspend(user.id, user.is_suspended)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                          user.is_suspended
                            ? 'bg-yellow-600/20 border-yellow-700/30 text-yellow-400 hover:bg-yellow-600 hover:text-white'
                            : 'bg-red-600/20 border-red-700/30 text-red-400 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-20 text-gray-500">No user accounts found on platform.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
