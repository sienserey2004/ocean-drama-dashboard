import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, History, Heart, Bookmark, LogOut } from 'lucide-react'
import { Button, IconButton, Divider } from '@/_ocean/ui'
import { useAuthStore } from '@/app/stores/authStore'

const ClientProfilePage: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuthStore()
    console.log(user)
    const navigate = useNavigate()
    const [tab, setTab] = React.useState(0)

    if (!isAuthenticated || !user) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                <h2 className="mb-2 text-xl font-bold">Profile</h2>
                <p className="mb-6 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Login to see your profile and saved videos</p>
                <Button color="primary" onClick={() => navigate('/login')} className="px-8">Login</Button>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-ocean-background-light dark:bg-ocean-background-dark pb-8 text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-ocean-background-light dark:bg-ocean-background-dark p-2">
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </IconButton>
                <p className="font-extrabold">{user.name || 'User'}</p>
                <IconButton onClick={() => navigate('/dashboard/profile')}>
                    <Settings size={20} />
                </IconButton>
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4 pt-2 text-center">
                <div className="mx-auto mb-4 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-full border-2 border-ocean-border-light dark:border-ocean-border-dark bg-ocean-card-light dark:bg-ocean-card-dark text-3xl font-black text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                    {user.profile_image ? (
                        <img src={user.profile_image} alt={user.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                        user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                <p className="mb-0.5 text-lg font-black">@{user.name?.toLowerCase().replace(/\s/g, '') || 'user'}</p>

                {/* Stats */}
                <div className="my-4 flex items-center justify-center gap-8">
                    <div className="text-center">
                        <p className="font-black">0</p>
                        <p className="text-xs text-ocean-text-secondary-light opacity-80 dark:text-ocean-text-secondary-dark">Following</p>
                    </div>
                    <div className="text-center">
                        <p className="font-black">0</p>
                        <p className="text-xs text-ocean-text-secondary-light opacity-80 dark:text-ocean-text-secondary-dark">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="font-black">0</p>
                        <p className="text-xs text-ocean-text-secondary-light opacity-80 dark:text-ocean-text-secondary-dark">Likes</p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outlined"
                        color="default"
                        onClick={() => navigate('/profile')}
                        className="px-6"
                    >
                        Edit profile
                    </Button>
                    <Button
                        variant="outlined"
                        color="danger"
                        startIcon={<LogOut size={16} />}
                        onClick={async () => {
                            await logout();
                            navigate('/');
                        }}
                        className="px-6"
                    >
                        Logout
                    </Button>
                </div>

                <p className="mx-auto mt-4 max-w-[300px] text-sm text-ocean-text-secondary-light opacity-90 dark:text-ocean-text-secondary-dark">
                    Movie enthusiast | Loving Ocean Drama short series 🌊✨
                </p>
            </div>

            <Divider />

            {/* Tabs */}
            <div className="flex border-b border-ocean-border-light dark:border-ocean-border-dark">
                {[
                    { value: 0, icon: History },
                    { value: 1, icon: Heart },
                    { value: 2, icon: Bookmark },
                ].map(({ value, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTab(value)}
                        className={`relative flex flex-1 items-center justify-center py-3 transition-colors ${
                            tab === value
                                ? 'text-primary'
                                : 'text-ocean-text-secondary-light hover:text-ocean-text-primary-light dark:text-ocean-text-secondary-dark dark:hover:text-ocean-text-primary-dark'
                        }`}
                    >
                        <Icon size={20} />
                        {tab === value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="relative min-h-[50vh]">
                <div className="grid grid-cols-3 gap-1 p-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-ocean-card-light dark:bg-ocean-card-dark"
                        >
                            <span className="text-ocean-text-secondary-light opacity-20 dark:text-ocean-text-secondary-dark">Video {i}</span>
                            <div className="absolute bottom-1 left-1 flex items-center gap-1">
                                <Heart size={14} />
                                <span className="text-xs font-bold">0</span>
                            </div>
                        </div>
                    ))}
                </div>

                {tab === 1 && (
                    <div className="p-8 text-center opacity-60">
                        <p>No liked videos yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ClientProfilePage
