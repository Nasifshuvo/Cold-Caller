'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UserIcon, MegaphoneIcon, CreditCardIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/client', icon: HomeIcon },
    { name: 'Profile', href: '/dashboard/client/profile', icon: UserIcon },
    // { name: 'Calls', href: '/dashboard/client/calls', icon: PhoneIcon },
    { 
      name: 'Campaigns', 
      href: '/dashboard/client/campaign/all', 
      icon: MegaphoneIcon,
      isActive: pathname?.startsWith('/dashboard/client/campaign')
    },
    { name: 'Billing', href: '/dashboard/client/billing', icon: CreditCardIcon },
    // { name: 'Imports', href: '/dashboard/client/imports', icon: DocumentIcon },
    // { name: 'Settings', href: '/dashboard/admin/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <h1 className="text-xl font-bold text-white">Client Portal</h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto bg-gray-800">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = item.isActive || pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 flex-shrink-0 h-6 w-6
                        ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 