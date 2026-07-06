import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Users, ShieldAlert, BadgeDollarSign } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'User Directory', path: '/admin/users', icon: Users },
    { name: 'Gig Moderation', path: '/admin/gigs', icon: ShieldAlert },
  ];

  return (
    <div className="w-64 bg-darkCard border-r border-gray-800 flex flex-col h-screen p-4 text-gray-300">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <BadgeDollarSign className="w-8 h-8 text-indigo-500" />
        <span className="text-xl font-bold text-white tracking-wider">OpSkl Console</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = router.pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        OpSkl Production Admin Console v1.0.0
      </div>
    </div>
  );
}
