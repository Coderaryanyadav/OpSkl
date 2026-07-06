import React from 'react';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Briefcase, IndianRupee, HeartHandshake } from 'lucide-react';

const mockData = [
  { name: 'Jan', Gigs: 40, Revenue: 2400 },
  { name: 'Feb', Gigs: 30, Revenue: 1398 },
  { name: 'Mar', Gigs: 75, Revenue: 9800 },
  { name: 'Apr', Gigs: 50, Revenue: 3908 },
  { name: 'May', Gigs: 90, Revenue: 4800 },
  { name: 'Jun', Gigs: 120, Revenue: 11200 },
];

export default function Dashboard() {
  const cards = [
    { title: 'Total Workers registered', value: '1,420', change: '+12% this week', icon: Users, color: 'text-blue-500' },
    { title: 'Active Gig Postings', value: '380', change: '+5% this week', icon: Briefcase, color: 'text-purple-500' },
    { title: 'Gross Volume (INR)', value: '₹4,82,500', change: '+18% this month', icon: IndianRupee, color: 'text-green-500' },
    { title: 'Successful Matches', value: '92.4%', change: '+1.2% match accuracy', icon: HeartHandshake, color: 'text-yellow-500' },
  ];

  return (
    <div className="flex bg-darkBg text-gray-100 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">System Operations Dashboard</h1>
          <p className="text-gray-400 mt-1">Realtime overview of platform activity and growth metrics.</p>
        </header>

        {/* Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-darkCard border border-gray-800 p-6 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-400">{c.title}</span>
                  <h3 className="text-2xl font-bold text-white mt-2">{c.value}</h3>
                  <span className="text-xs text-gray-500 mt-1 block">{c.change}</span>
                </div>
                <div className={`p-3 bg-gray-900 rounded-lg ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </section>

        {/* Analytics Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-darkCard border border-gray-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Completed Gigs (Month-on-Month)</h3>
            <div className="h-80 w-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#1F2937' }} />
                  <Bar dataKey="Gigs" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-darkCard border border-gray-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Gross Platform Transactions Volume</h3>
            <div className="h-80 w-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#1F2937' }} />
                  <Line type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
