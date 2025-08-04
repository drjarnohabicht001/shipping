'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from "next/image";
import Logo from '../../../public/svg/logo';
import { Button } from '@/Components/Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#00000055] shadow-md' : 'bg-transparent'}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 mr-52 bg-[#00000033] w-max px-8 rounded-4xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${pathname === item.href
                  ? scrolled
                    ? 'text-white border-b-2 border-white'
                    : 'text-white border-b-2 border-white'
                  : scrolled
                    ? 'text-white/90 hover:text-white'
                    : 'text-white/90 hover:text-white'
                  } px-1 py-2 text-1xl font-medium transition-colors duration-300`}
              >
                {item.name}
              </Link>
            ))}


            <Button className='px-8 py-3 text-sm  text-white rounded-full hover:bg-white/10 hover:border-white/80 transition-colors duration-300"'>
              GET A QUOTE
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${scrolled
                ? 'text-white hover:bg-[#FF5A24]/80'
                : 'text-white hover:bg-white/20'
                } focus:outline-none transition-colors duration-300`}
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} ${scrolled ? 'bg-[#FF5A24]' : 'bg-[#2E3135]/90'
        } transition-all duration-300`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${pathname === item.href
                ? 'bg-white/10 text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}