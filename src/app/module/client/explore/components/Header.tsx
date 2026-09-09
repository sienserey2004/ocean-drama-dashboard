import { useAuthStore } from "@/app/stores/authStore";
import { Bell, GridIcon , CircleFadingPlus} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    return (
    <header className="flex md:hidden items-center justify-between px-5 py-4 md:py-8 sticky top-0 bg-[#08090C]/60 backdrop-blur-xl z-50 border-b border-white/5 md:border-none">
        <div className="flex items-center gap-4 " onClick={() => navigate("/profile-screen")} role="button">
            <div className="relative group cursor-pointer">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center text-sm md:text-base font-bold text-white shadow-lg shadow-[#0EA5E9]/30 transform group-hover:scale-105 transition-all">
                    {user?.profile_image ? (
                        <img
                            src={user.profile_image}
                            alt=""
                            className="w-full h-full rounded-xl object-cover"
                        />
                    ) : (
                        user?.name?.charAt(0).toUpperCase() || "U"
                    )}
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#08090C] absolute -bottom-0.5 -right-0.5 shadow-sm"></div>
            </div>
            <div>
                <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest uppercase opacity-70">
                    Good evening,
                </p>
                <h1 className="text-sm md:text-xl font-black text-white tracking-tight">
                    {user?.name}
                </h1>
            </div>
        </div>

        {/* LOGO */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <h1
                className="text-3xl font-black tracking-tighter text-white uppercase italic"
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    textShadow: "2px 2px 0px #0EA5E9, 4px 4px 0px #0284C7",
                }}
            >
                OCEAN DRAMA
            </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            <button
                onClick={() => navigate("/dashboard/app-studio")}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 hover:scale-110 active:scale-95 group"
            >
               <CircleFadingPlus
                size={18}
                className="text-[#9CA3AF] group-hover:text-white"
               />
            </button>
            <button
                onClick={() => navigate("/notifications")}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 relative hover:scale-110 active:scale-95 group"
            >
                <Bell
                    size={18}
                    className="text-[#9CA3AF] group-hover:text-white"
                />
                <span className="w-2 h-2 rounded-full bg-[#0EA5E9] absolute top-2.5 right-2.5 ring-2 ring-[#08090C] shadow-[0_0_10px_#0EA5E9]"></span>
            </button>
        </div>
    </header>
    )
}
