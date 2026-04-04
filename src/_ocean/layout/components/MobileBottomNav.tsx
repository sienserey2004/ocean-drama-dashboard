// MobileBottomNav.tsx
import React from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Box,
} from "@mui/material";
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
  // ✅ normalize path for active tab (supports nested routes)
  const getActiveValue = () => {
    const path = location.pathname;
    if (path.startsWith("/explore")) return "/explore";
    if (path.startsWith("/library")) return "/library";
    if (path.startsWith("/profile")) return "/profile";
    return "/"; // Home default (covers / and /viewer)
  };

  const [value, setValue] = React.useState(getActiveValue());

  // ✅ keep tab in sync with URL
  React.useEffect(() => {
    setValue(getActiveValue());
  }, [location.pathname]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: { xs: "block", md: "none" },
        zIndex: 100,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(e, newValue) => {
          // 🔐 handle auth case
          if (newValue === "/profile" && !isAuthenticated) {
            navigate("/login");
            return;
          }

          setValue(newValue);
          navigate(newValue); // ✅ single clean navigation
        }}
        showLabels
        sx={{
          bgcolor: "transparent",
          py: 0.5,
        }}
      >
       

        {/* Explore */}
        <BottomNavigationAction
          value="/explore"
          icon={<HomeIcon sx={{ fontSize: 22 }} />}
          label="Home"
          sx={{
            color: "#777",
            "&.Mui-selected": { color: "#FE2C55" },
            fontSize: 10,
          }}
        />
 {/* Home */}
        <BottomNavigationAction
          value="/"
          icon={<TravelExploreIcon sx={{ fontSize: 22 }} />}
          label="Explore"
          sx={{
            color: "#777",
            "&.Mui-selected": { color: "#FE2C55" },
            fontSize: 10,
          }}
        />
        {/* My List */}
        <BottomNavigationAction
          value="/library"
          icon={<VideoLibraryIcon sx={{ fontSize: 22 }} />}
          label="My List"
          sx={{
            color: "#777",
            "&.Mui-selected": { color: "#FE2C55" },
            fontSize: 10,
          }}
        />

        {/* Profile (with Avatar) */}
        <BottomNavigationAction
          value="/profile"
          label="Profile"
          icon={
            <Box>
              <Avatar
                src={user?.profile_image || ""}
                sx={{
                  width: 26,
                  height: 26,
                  border: "1.5px solid white",
                  bgcolor: isAuthenticated
                    ? "primary.main"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || (
                  <PersonIcon sx={{ fontSize: 16 }} />
                )}
              </Avatar>
            </Box>
          }
          sx={{
            color: "#777",
            "&.Mui-selected": { color: "#FE2C55" },
            fontSize: 10,
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
