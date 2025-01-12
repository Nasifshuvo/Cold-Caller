'use client';
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/clients/balance');
        const data = await response.json();
        if (data.balance) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
    // Fetch every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
              Balance: ${Number(balance).toFixed(2)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session?.user?.email}</span>
            <Button
              variant="secondary"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 