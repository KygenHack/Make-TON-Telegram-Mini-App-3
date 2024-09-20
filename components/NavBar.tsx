'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserGroupIcon, CurrencyDollarIcon, LightningBoltIcon } from '@heroicons/react/solid'; // Using Heroicons for a professional look

const NavBar = () => {
  const pathname = usePathname();

  // Styles for active and inactive states with explicit type for isActive
  const linkStyle = (isActive: boolean) =>
    `flex flex-col items-center justify-center custom-active p-2 rounded-lg transition-colors duration-300 ${
      isActive ? 'text-black bg-white shadow-md' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 custom-width max-w-xl bg-black backdrop-blur-lg border border-gray-700 shadow-xl flex justify-around items-center z-50 rounded-3xl text-sm custom-padding">
      <Link href="/" className={linkStyle(pathname === '/')} aria-label="Home">
      <LightningBoltIcon className="w-6 h-6" />
      <p className="mt-1">Earn</p>
      </Link>
     
      <Link href="/leaderboard" className={linkStyle(pathname === '/leaderboard')} aria-label="Leaderboard">
        <CurrencyDollarIcon className="w-6 h-6" />
        <p className="mt-1">Leaderboard</p>
      </Link>

      <Link href="/friends" className={linkStyle(pathname === '/friends')} aria-label="Friends">
        <UserGroupIcon className="w-6 h-6" />
        <p className="mt-1">Friends</p>
      </Link>
    </div>
  );
};

export default NavBar;
