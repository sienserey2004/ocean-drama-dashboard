// MobileBottomNav.tsx
import React from "react";
import { Home, Search, Compass, Library, User } from "lucide-react";
import { NavigateFunction, Location } from "react-router-dom";
import { Avatar } from "@/_ocean/ui";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  /** Extra path prefixes that also belong to this tab, e.g. the player under My List. */
  match?: string[];
}

interface MobileBottomNavProps {
  user: any;
  isAuthenticated: boolean;
  location: Location;
  navigate: NavigateFunction;
  items?: NavItem[];
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  user,
  isAuthenticated,
  location,
  navigate,
  items,
}) => {
  const defaultItems: NavItem[] = [
    { label: "Home", icon: <Home size={22} />, path: "/" },
    { label: "Explore", icon: <Compass size={22} />, path: "/explore" },
    { label: "Search", icon: <Search size={22} />, path: "/search" },
    {
      label: "My List",
      icon: <Library size={22} />,
      path: "/library",
      // The player belongs to My List. /episodes is deliberately not claimed —
      // it is reached from Explore, Coins and creator profiles, not the library.
      match: ["/play"],
    },
    {
      label: "Profile",
      // No white tint on the Avatar: the bar is light in light theme, so its own
      // primary-tinted fallback is the one that reads in both.
      icon: (
        <Avatar src={user?.profile_image} size="sm" className="text-xs">
          {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
        </Avatar>
      ),
      path: "/profile-screen",
    },
  ];

  const currentItems = items || defaultItems;

  // Derived from the URL during render — the previous copy in useState could
  // disagree with the route after a back/forward or a redirect.
  const activeIndex = (() => {
    // The viewer routes are mounted twice: at the root and under /viewer
    // (e.g. /search and /viewer/search). Strip the prefix so both light up the same tab.
    const path = location.pathname.replace(/^\/viewer(?=\/|$)/, "") || "/";
    const owns = (prefix: string) =>
      path === prefix || (prefix !== "/" && path.startsWith(prefix + "/"));
    // No match means no tab is active. Falling back to index 0 used to light up
    // Home on every unmapped route, which read as "you are on the home tab".
    return currentItems.findIndex(
      (item) => owns(item.path) || (item.match ?? []).some(owns),
    );
  })();

  const handleNav = (path: string) => {
    if (path === "/profile-screen" && !isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  return (
    <nav
      aria-label="Primary"
      // Height here is the contract behind --tab-bar-h in index.css; anything
      // that has to sit above the bar offsets by that variable. Keep them in step.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[1300] flex justify-center px-3 pb-[env(safe-area-inset-bottom,12px)] md:hidden"
    >
      <div className="pointer-events-auto flex w-full max-w-[420px] rounded-[22px] border border-ocean-border-light bg-ocean-surface-light/90 shadow-[0_6px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#14141A]/85 dark:shadow-[0_8px_28px_rgba(0,0,0,0.55)]">
        {currentItems.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <button
              key={item.path + item.label}
              type="button"
              onClick={() => handleNav(item.path)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 rounded-[22px] py-2 transition-transform duration-150 active:scale-95"
            >
              {/* Capsule behind the icon carries the active state, so the label
                  stays put instead of the whole row shifting on selection. */}
              <span
                className={`flex h-8 w-[52px] items-center justify-center rounded-full transition-colors duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[11px] leading-none transition-colors duration-200 ${
                  isActive
                    ? "font-semibold text-primary"
                    : "font-medium text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
