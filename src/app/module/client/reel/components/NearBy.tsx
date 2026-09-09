import React from 'react'
import { MapPin } from 'lucide-react'

const NearBy = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#08090C]">
      <div className="flex flex-col items-center gap-4 opacity-50">
        <MapPin size={60} className="text-[#9CA3AF]" />
        <p className="text-lg font-bold tracking-[1px] text-[#9CA3AF]">
          No Dramas Nearby
        </p>
        <p className="text-sm text-[#4B5563]">
          Enable location to find trending dramas in your area
        </p>
      </div>
    </div>
  )
}

export default NearBy
