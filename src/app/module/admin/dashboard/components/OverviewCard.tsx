import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: "24px",
        bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.4),
        backdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: isDark ? alpha("#FFFFFF", 0.08) : "rgba(14,165,233,0.1)",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "&:hover": {
          transform: "translateY(-8px) scale(1.02)",
          boxShadow: isDark
            ? `0 20px 40px -20px ${alpha(theme.palette[color as "primary"].main, 0.4)}`
            : `0 20px 40px -20px ${alpha("#0EA5E9", 0.2)}`,
          borderColor: theme.palette[color as "primary"].main,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: (theme) =>
                  alpha(theme.palette[color as "primary"].main, 0.1),
                color: (theme) => theme.palette[color as "primary"].main,
                width: 48,
                height: 48,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: (theme) =>
                  alpha(theme.palette[color as "primary"].main, 0.2),
              }}
            >
              {icon}
            </Avatar>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette[color as "primary"].main, boxShadow: `0 0 10px ${theme.palette[color as "primary"].main}` }} />
          </Box>
          
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontSize: '0.65rem'
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{ 
                fontWeight: 900, 
                color: "text.primary",
                letterSpacing: '-1.5px',
                mt: 0.5
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OverviewCard;
