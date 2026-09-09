// DesktopNavbar.tsx
import React, { useRef, useState } from 'react';
import { Home, Compass, Search, Library, Bell, Coins, User, Settings, LogOut } from 'lucide-react';
import { NavigateFunction, Location } from 'react-router-dom';
import { Avatar, IconButton, Menu, MenuItem, Divider } from '@/_ocean/ui';
import { useAuthStore } from '@/app/stores/authStore';
import toast from '@/app/utils/toast';

interface DesktopNavbarProps {
  user: any;
  isAuthenticated: boolean;
  location: Location;
  navigate: NavigateFunction;
}

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  user,
  isAuthenticated,
  location,
  navigate,
}) => {
  const navItems = [
    { label: 'For You', icon: Home, path: '/viewer', exact: true },
    { label: 'Explore', icon: Compass, path: '/explore', exact: false },
    { label: 'Search', icon: Search, path: '/search', exact: false },
    { label: 'Series', icon: Library, path: '/library', exact: false },
    { label: 'Coins', icon: Coins, path: '/coins', exact: true },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    if (path === '/library') return location.pathname.includes('/library');
    if (path === '/search') return location.pathname.includes('/search');
    if (path === '/viewer' && location.pathname === '/') return true; // handle root redirect
    return location.pathname.startsWith(path);
  };

  const { logout } = useAuthStore();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    toast.success("You've been logged out.");
    navigate('/');
  };

  return (
    <div className="hidden h-[70px] items-center justify-between border-b border-white/[0.08] bg-[rgba(11,11,15,0.7)] px-6 backdrop-blur-2xl sticky top-0 z-[1000] md:flex">
      <p
        onClick={() => navigate('/viewer')}
        className="cursor-pointer text-2xl font-black uppercase tracking-wider text-white"
        style={{ textShadow: '2px 2px 0px #0EA5E9' }}
      >
        Ocean Drama
      </p>

      <div className="flex items-center gap-12">
        {navItems.map((item) => (
          <p
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`relative cursor-pointer text-xs font-black uppercase tracking-widest transition-colors duration-300 hover:text-white ${
              isActive(item.path, item.exact) ? 'text-primary' : 'text-zinc-400'
            }`}
          >
            {item.label}
            {isActive(item.path, item.exact) && (
              <span
                className="absolute left-1/2 -bottom-2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                style={{ boxShadow: '0 0 10px #0EA5E9' }}
              />
            )}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <IconButton plain className="text-zinc-400 transition-colors duration-300 hover:text-primary">
          <Bell size={22} />
        </IconButton>
        <div className="relative">
          <button
            ref={avatarRef}
            onClick={() => (isAuthenticated ? setAccountMenuOpen((v) => !v) : navigate('/login'))}
            className="transition-transform duration-300 hover:scale-110"
          >
            <Avatar
              src={user?.profile_image}
              alt={user?.name}
              size="md"
              className="border-2 border-[#2A2A35] bg-[#1A1A22] hover:border-primary"
            />
          </button>
          <Menu open={accountMenuOpen} onClose={() => setAccountMenuOpen(false)} anchorRef={avatarRef}>
            <MenuItem onClick={() => { navigate('/profile-screen'); setAccountMenuOpen(false); }}>
              <User size={16} /> Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/dashboard/profile'); setAccountMenuOpen(false); }}>
              <Settings size={16} /> Account Settings
            </MenuItem>
            <Divider className="my-1" />
            <MenuItem danger onClick={handleLogout}>
              <LogOut size={16} /> Log Out
            </MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default DesktopNavbar;
