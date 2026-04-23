import React from 'react'
import { Box, Typography, Stack } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn';

const NearBy = () => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        bgcolor: "#08090C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack alignItems="center" spacing={2} sx={{ opacity: 0.5 }}>
        <LocationOnIcon sx={{ fontSize: 60, color: '#9CA3AF' }} />
        <Typography
          sx={{
            color: "#9CA3AF",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          No Dramas Nearby
        </Typography>
        <Typography sx={{ color: "#4B5563", fontSize: 14 }}>
          Enable location to find trending dramas in your area
        </Typography>
      </Stack>
    </Box>
  )
}

export default NearBy