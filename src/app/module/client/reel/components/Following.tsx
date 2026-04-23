import React from 'react'
import { Box, Typography, Stack } from '@mui/material'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

const Following = () => {
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
        <RecordVoiceOverIcon sx={{ fontSize: 60, color: '#9CA3AF' }} />
        <Typography
          sx={{
            color: "#9CA3AF",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          Following feed is empty
        </Typography>
        <Typography sx={{ color: "#4B5563", fontSize: 14 }}>
          Follow some creators to see their latest dramas here
        </Typography>
      </Stack>
    </Box>
  )
}

export default Following