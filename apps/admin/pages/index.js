import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, ShieldAlert, BadgeDollarSign, Activity, Eye, Ban, CheckCircle, Search, Bell, Menu, Check } from 'lucide-react';

// Initialize Supabase (Use env vars in real app)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getServerSideProps() {
    try {
        // Use Service Role Key if available for full admin access, otherwise falls back to Anon
        // Note: in a real production, ALWAYS use Service Role Key server-side for admin dashboards.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const { count: totalUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
        const { count: activeGigs } = await supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).in('status', ['open', 'active']);
        const pendingReports = 0; // Reports table not yet implemented

        const totalVolume = 0; // Transactions table not yet implemented

        const { data: pendingUsers } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, created_at')
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5);

        const formattedQueue = pendingUsers?.map(user => ({
            id: user.id,
            name: user.full_name || 'Unknown User',
            status: 'pending',
            time: new Date(user.created_at).toLocaleDateString(),
            initial: (user.full_name || 'U').charAt(0).toUpperCase()
        })) || [];

        // Gig Activity (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentGigs } = await supabaseAdmin
            .from('gigs')
            .select('created_at')
            .gte('created_at', sevenDaysAgo.toISOString());

        const activityMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            activityMap[dayName] = 0;
        }

        recentGigs?.forEach(gig => {
            const d = new Date(gig.created_at);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            if (activityMap[dayName] !== undefined) {
                activityMap[dayName]++;
            }
        });

        const gigActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            gigActivity.push({ name: dayName, gigs: activityMap[dayName] });
        }

        return {
            props: {
                stats: {
                    totalUsers: totalUsers || 0,
                    activeGigs: activeGigs || 0,
                    pendingReports: pendingReports || 0,
                    totalVolume: totalVolume,
                },
                kycQueue: formattedQueue,
                gigActivity: gigActivity
            }
        };

    } catch (error) {
        console.error("Server-side fetching error:", error);
        return {
            props: {
                error: true,
                stats: { totalUsers: 0, activeGigs: 0, pendingReports: 0, totalVolume: 0 },
                kycQueue: [],
                gigActivity: []
            }
        };
    }
}

export default function AdminDashboard({ stats, kycQueue, gigActivity, error }) {
    const router = useRouter(); // Use to refresh data
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loadingAction, setLoadingAction] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Fetch users when tab changes
    if (activeTab === 'users' && users.length === 0 && !loadingUsers) {
        setLoadingUsers(true);
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
            .then(({ data, error }) => {
                if (data) setUsers(data);
                setLoadingUsers(false);
            });
    }

    const handleBanUser = async (userId) => {
        if (!confirm("Are you sure you want to ban this user?")) return;
        setLoadingAction(userId);
        const { error } = await supabase.rpc('ban_user', { target_id: userId });
        if (error) {
            alert("Failed to ban user: " + error.message);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: true } : u));
        }
        setLoadingAction(null);
    };

    // Add function to handle verification via RPC
    const handleVerifyUser = async (userId) => {
        setLoadingAction(userId);
        try {
            // Call the database function directly (requires admin_actions.sql to be run)
            const { error } = await supabase.rpc('approve_kyc', { target_id: userId });

            if (error) {
                console.error("RPC Error:", error);
                // Fallback to API if RPC fails (allows mixed deployment)
                const res = await fetch('/api/admin/verify-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, action: 'verify' }),
                });
                const data = await res.json();
                if (data.success) {
                    router.replace(router.asPath);
                } else {
                    alert('Failed to verify. Please ensure database functions are installed.');
                }
            } else {
                // Success via RPC
                router.replace(router.asPath);
            }
        } catch (err) {
            console.error(err);
            alert('Error executing verification.');
        } finally {
            setLoadingAction(null);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
                    <p className="text-gray-500">Could not fetch dashboard data. Please check your Supabase connection.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-72 bg-black text-white p-6 z-50 shadow-2xl flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-black font-bold text-lg">O</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">OpSkl Admin</h1>
                    </div>

                    <nav className="space-y-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4 px-4">Overview</p>
                        <NavItem
                            icon={<Activity size={20} />}
                            label="Dashboard"
                            active={activeTab === 'dashboard'}
                            onClick={() => setActiveTab('dashboard')}
                        />
                        <NavItem
                            icon={<Users size={20} />}
                            label="User Management"
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                        />
                        <NavItem
                            icon={<BadgeDollarSign size={20} />}
                            label="Financials"
                            active={activeTab === 'finance'}
                            onClick={() => setActiveTab('finance')}
                        />

                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-8 mb-4 px-4">Safety & Trust</p>
                        <NavItem
                            icon={<ShieldAlert size={20} />}
                            label="Reports"
                            active={activeTab === 'reports'}
                            badge={stats.pendingReports}
                            alert
                            onClick={() => setActiveTab('reports')}
                        />
                        <NavItem
                            icon={<CheckCircle size={20} />}
                            label="KYC Requests"
                            active={activeTab === 'kyc'}
                            badge={kycQueue.length}
                            onClick={() => setActiveTab('kyc')}
                        />
                    </nav>
                </div>

                <div className="p-4 bg-white/10 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">System Status</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium">All Systems Operational</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area - Swaps based on Active Tab */}
            <main className="ml-72 flex-1 p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
                        <p className="text-gray-500 mt-1">Welcome back, Administrator.</p>
                    </div>
                    {/* Header Controls */}
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-500 hover:text-black transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-300 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-4 gap-6 mb-10">
                            <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} trend="+12%" isPositive icon={<Users size={20} className="text-gray-400" />} />
                            <StatCard title="Active Gigs" value={stats.activeGigs.toLocaleString()} trend="+5%" isPositive icon={<Activity size={20} className="text-gray-400" />} />
                            <StatCard title="Revenue Volume" value={`₹${(stats.totalVolume / 100).toLocaleString()}`} trend="+8%" isPositive icon={<BadgeDollarSign size={20} className="text-gray-400" />} />
                            <StatCard title="Critical Reports" value={stats.pendingReports} trend="-2" isPositive alert icon={<ShieldAlert size={20} className="text-red-500" />} />
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 bg-white p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-8">Platform Activity</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={gigActivity}>
                                            <defs>
                                                <linearGradient id="colorGigs" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="gigs" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#colorGigs)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Dashboard KYC Queue */}
                            <div className="bg-white p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Verification Queue</h3>
                                    <span className="bg-black text-white text-xs px-2.5 py-1 rounded-full">{kycQueue.length} Pending</span>
                                </div>
                                <div className="space-y-4">
                                    {kycQueue.length === 0 ? <p className="text-sm text-gray-400">All caught up!</p> : kycQueue.map((user) => (
                                        <div key={user.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{user.initial}</div>
                                                <div><p className="font-semibold text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.time}</p></div>
                                            </div>
                                            <button
                                                onClick={() => handleVerifyUser(user.id)}
                                                disabled={loadingAction === user.id}
                                                className="w-full py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                            >
                                                {loadingAction === user.id ? 'Verifying...' : 'Verify User'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Placeholder views for other tabs to demonstrate interactivity */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">User Management</h3>
                            <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">Export CSV</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Trust Score</th>
                                        <th className="p-4">Joined</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                                                    {(user.full_name || 'U').charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900">{user.full_name}</div>
                                            </td>
                                            <td className="p-4 capitalize text-gray-600">{user.active_role}</td>
                                            <td className="p-4">
                                                {user.is_banned ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Banned</span>
                                                ) : user.is_verified ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Verified</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">Unverified</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono font-medium">{user.trust_score}</td>
                                            <td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                {!user.is_banned && (
                                                    <button
                                                        onClick={() => handleBanUser(user.id)}
                                                        disabled={loadingAction === user.id}
                                                        className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
                                                    >
                                                        {loadingAction === user.id ? 'Banning...' : 'Ban User'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-400">
                                                {loadingUsers ? 'Loading users...' : 'No users found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Financial Transactions</h3>
                        </div>
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">💰</div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h4>
                            <p className="text-gray-500">Transaction tracking will be available in the next update.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Pending Reports</h3>
                        </div>
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">🚨</div>
                        </div>
                    </div>
                )}

                {activeTab === 'kyc' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kycQueue.map((user) => (
                            <div key={user.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">{user.initial}</div>
                                    <div>
                                        <h3 className="font-bold text-lg">{user.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">Pending Review</span>
                                            <span className="text-xs text-gray-500">{user.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Government ID</span>
                                        <span className="font-medium text-black">Uploaded</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Selfie Video</span>
                                        <span className="font-medium text-blue-600 cursor-pointer hover:underline">View Video</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleVerifyUser(user.id)}
                                        disabled={loadingAction === user.id}
                                        className="flex-1 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                                    >
                                        {loadingAction === user.id ? 'Processing...' : <><Check size={16} /> Approve</>}
                                    </button>
                                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                                        <Ban size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {kycQueue.length === 0 && (
                            <div className="col-span-3 text-center py-20 text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No pending KYC requests</p>
                            </div>
                        )}
                    </div>
                )
                }
            </main >
        </div >
    );
}

function NavItem({ icon, label, active, badge, alert, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${active ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
        >
            <span className={`${active ? 'text-black' : 'text-gray-400 group-hover:text-white'}`}>
                {icon}
            </span>
            <span className="font-medium flex-1 text-sm">{label}</span>
            {badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300'}`}>
                    {badge}
                </span>
            )}
        </div>
    );
}

function StatCard({ title, value, trend, isPositive, alert, icon }) {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border transition-all hover:shadow-md ${alert ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {icon}
                </div>
                {alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
                <span className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}
