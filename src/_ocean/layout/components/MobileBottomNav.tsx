// MobileBottomNav.tsx
import React from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Box,
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import HomeIcon from "@mui/icons-material/Home";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PersonIcon from "@mui/icons-material/Person";
import { NavigateFunction, Location } from "react-router-dom";

interface MobileBottomNavProps {
  user: any;
  isAuthenticated: boolean;
  location: Location;
  navigate: NavigateFunction;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  user,
  isAuthenticated,
  location,
  navigate,
}) => {
  const getActiveValue = () => {
    const path = location.pathname;
    if (path.startsWith("/explore")) return 1;
    if (path.startsWith("/coins")) return 2;
    if (path.startsWith("/library")) return 3;
    if (path.startsWith("/profile-screen")) return 4;
    return 0; // Home
  };

  const [activeIndex, setActiveIndex] = React.useState(getActiveValue());

  React.useEffect(() => {
    setActiveIndex(getActiveValue());
  }, [location.pathname]);

  const navItems = [
    { label: "Home", icon: <HomeIcon sx={{ fontSize: 24 }} />, path: "/" },
    { label: "Explore", icon: <TravelExploreIcon sx={{ fontSize: 24 }} />, path: "/explore" },
    { label: "Coins", icon: <SavingsIcon sx={{ fontSize: 24 }} />, path: "/coins" },
    { label: "My List", icon: <VideoLibraryIcon sx={{ fontSize: 24 }} />, path: "/library" },
    { 
      label: "Profile", 
      icon: (
        <Avatar
          src={user?.profile_image || ""}
          sx={{
            width: 26,
            height: 26,
            border: "1.5px solid rgba(255,255,255,0.6)",
            bgcolor: isAuthenticated ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            fontSize: 12,
            transition: "all 0.3s ease",
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: 16 }} />}
        </Avatar>
      ),
      path: "/profile-screen" 
    },
  ];

  const handleNav = (index: number, path: string) => {
    if (path === "/profile-screen" && !isAuthenticated) {
      navigate("/login");
      return;
    }
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "flex", md: "none" },
        justifyContent: "center",
        alignItems: "flex-end",
        pb: "env(safe-area-inset-bottom, 20px)",
        zIndex: 1300,
        pointerEvents: "none",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mx: 2,
          mb: 2,
          width: "calc(100% - 48px)",
          maxWidth: 420,
          borderRadius: "32px",
          background: "rgba(30, 30, 30, 0.45)", // Lighter for better glass effect
          backdropFilter: "blur(25px) saturate(180%)",
          WebkitBackdropFilter: "blur(25px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          overflow: "hidden",
          pointerEvents: "auto",
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", position: "relative", height: 72, px: 1.5 }}>
          {/* Sliding Indicator Pill - Clear Glass Style */}
          <Box
            sx={{
              position: "absolute",
              top: 10,
              bottom: 10,
              left: `${(activeIndex * 19.5) + 2}%`, // Adjusted for padding
              width: "17%",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 0,
            }}
          />

          {navItems.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <Box
                key={index}
                onClick={() => handleNav(index, item.path)}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 1,
                  transition: "all 0.3s ease",
                  transform: isActive ? "translateY(-1px)" : "none",
                  "&:active": { transform: "scale(0.94)" },
                }}
              >
                <Box
                  sx={{
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    mb: 0.5,
                    filter: isActive ? "drop-shadow(0 0 10px rgba(255,255,255,0.3))" : "none",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {item.icon}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: "10px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.4px",
                    textTransform: "uppercase", // Subtle glass refinement
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {item.label}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default MobileBottomNav;