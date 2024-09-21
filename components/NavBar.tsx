'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserGroupIcon, LightningBoltIcon, TagIcon } from '@heroicons/react/solid'; // Using Heroicons for a professional look

const NavBar = () => {
  const pathname = usePathname();

  // Styles for active and inactive links
  const linkStyle = (isActive: boolean) =>
    `flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-300 ${
      isActive ? 'text-white bg-gray-800 shadow-lg' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-xl bg-black backdrop-blur-lg border border-gray-700 shadow-xl flex justify-around items-center z-50 rounded-3xl text-sm py-2 px-4">
      <Link href="/" className={linkStyle(pathname === '/')} aria-label="Home">
        <LightningBoltIcon className="w-6 h-6" />
        <p className="mt-1">Home</p>
      </Link>

      <Link href="/quest" className={linkStyle(pathname === '/quest')} aria-label="Quest">
        <TagIcon className="w-6 h-6" />
        <p className="mt-1">Quest</p>
      </Link>

      <Link href="/frens" className={linkStyle(pathname === '/frens')} aria-label="Friends">
        <UserGroupIcon className="w-6 h-6" />
        <p className="mt-1">Friends</p>
      </Link>
    </div>
  );
};

export default NavBar;
