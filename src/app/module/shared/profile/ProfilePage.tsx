import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Heart,
  History,
  KeyRound,
  Laptop,
  Library,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react'
import toast from '@/app/utils/toast'
import { useAuthStore } from '@/app/stores/authStore'
import { authApi } from '@/app/api/authApi.service'
import { userApi } from '@/app/api/user.service'
import {
  AdminCard,
  AdminLTE,
  ContentHeader,
  InfoBox,
  LteBadge,
  LteDialog,
  SmallBox,
  type LteColor,
} from '@/app/module/shared/adminlte'

type ProfileFormData = {
  name: string
  phone: string
}

type PasswordFormData = {
  current_password: string
  new_password: string
  confirm_password: string
}

type DeleteFormData = {
  password: string
}

const formatDate = (date?: string) => {
  if (!date) return 'Not available'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

const getInitials = (name?: string) => {
  const initials = (name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
  return initials.toUpperCase()
}

const getDeviceName = () => {
  if (typeof navigator === 'undefined') return 'Current browser session'
  const browser = /Edg\//.test(navigator.userAgent)
    ? 'Edge'
    : /Chrome\//.test(navigator.userAgent)
      ? 'Chrome'
      : /Firefox\//.test(navigator.userAgent)
        ? 'Firefox'
        : 'Browser'
  const platform = /Mac/.test(navigator.userAgent) ? 'macOS' : /Win/.test(navigator.userAgent) ? 'Windows' : 'device'
  return `${browser} on ${platform}`
}

export default function ProfilePage() {
  const { user, refreshUser, logout, isAdmin, isCreator, role } = useAuthStore()
  const navigate = useNavigate()
  const isViewer = role === 'viewer'

  const [editMode, setEditMode] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    getValues,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>()

  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors },
  } = useForm<DeleteFormData>()

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  if (!user) return null

  const stats = user.stats || {
    purchases_count: 0,
    favorites_count: 0,
    following_count: 0,
    watch_history_count: 0,
  }

  const profileFields = [user.name, user.email, user.phone, user.profile_image]
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
  const membershipLabel = isAdmin ? 'Administrator' : isCreator ? 'Creator' : 'Viewer'
  const membershipDescription = isAdmin
    ? 'You have full access to platform management tools.'
    : isCreator
      ? 'Your creator workspace is ready for publishing and earnings.'
      : 'Save series, follow creators, and keep your watch history in sync.'

  const startEditing = () => {
    reset({ name: user.name || '', phone: user.phone || '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditMode(true)
  }

  const cancelEditing = () => {
    reset({ name: user.name || '', phone: user.phone || '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditMode(false)
  }

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (selected.size > 8 * 1024 * 1024) {
      toast.error('Profile photos must be smaller than 8 MB.')
      return
    }
    setPhotoFile(selected)
    setPhotoPreview(URL.createObjectURL(selected))
  }

  const saveProfile = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      let payload: FormData | ProfileFormData = data
      if (photoFile) {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('phone', data.phone)
        formData.append('profile_image', photoFile)
        payload = formData
      }

      const response = await userApi.updateMe(payload)
      if (!response) throw new Error('Profile update failed')
      await refreshUser()
      toast.success('Profile updated successfully')
      setEditMode(false)
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch {
      toast.error('Unable to save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match.')
      return
    }
    try {
      await authApi.changePassword(data)
      toast.success('Password updated successfully')
      setChangePasswordOpen(false)
      resetPassword()
    } catch {
      // The API client already surfaces the server error; keep the dialog open.
    }
  }

  const deleteAccount = async (data: DeleteFormData) => {
    try {
      const response = await userApi.deleteMe(data.password)
      if (!response) throw new Error('Account deletion failed')
      toast.success('Account deleted')
      await logout()
      navigate('/login')
    } catch {
      toast.error('Unable to delete your account. Check your password and try again.')
    }
  }

  const avatarSource = photoPreview || user.profile_image || ''
  const roleColor: LteColor = isAdmin ? 'danger' : isCreator ? 'purple' : 'info'

  return (
    <AdminLTE className="profile-page -m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title="My Profile"
        description="Manage your account details, security, and viewing activity."
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }]}
        actions={
          <div className="profile-header-actions">
            {isViewer && (
              <button type="button" className="btn btn-default btn-sm" onClick={() => navigate(-1)}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={editMode ? cancelEditing : startEditing}>
              <Pencil size={15} /> {editMode ? 'Cancel editing' : 'Edit profile'}
            </button>
          </div>
        }
      />

      <div className="profile-stat-grid">
        <SmallBox color="info" value={stats.purchases_count} label="Series in library" icon={<Library size={66} />} footerText="Open library" to="/library" />
        <SmallBox color="danger" value={stats.favorites_count} label="Saved favorites" icon={<Heart size={66} />} footerText="View favorites" to="/favorites" />
        <SmallBox color="success" value={stats.following_count} label="Creators following" icon={<Users size={66} />} footerText="View following" to="/following" />
        <SmallBox color="warning" value={stats.watch_history_count} label="Watched recently" icon={<History size={66} />} footerText="Open history" to="/watch-history" />
      </div>

      <div className="profile-layout">
        <div className="profile-main-column">
          <AdminCard
            title="Profile information"
            icon={<UserRound size={18} />}
            outline="primary"
            tools={
              <button type="button" className="btn-tool" onClick={editMode ? cancelEditing : startEditing} aria-label={editMode ? 'Cancel editing' : 'Edit profile'}>
                {editMode ? 'Cancel' : <><Pencil size={15} /> Edit</>}
              </button>
            }
          >
            <div className="profile-cover">
              <div className="profile-cover-art" aria-hidden="true"><FileText size={82} /></div>
              <div className="profile-cover-copy">
                <span>Ocean Drama account</span>
                <small>Your personal information is private to your account.</small>
              </div>
              <ShieldCheck size={34} className="profile-cover-shield" />
            </div>

            <div className="profile-identity">
              <div className="profile-avatar">
                {avatarSource ? <img src={avatarSource} alt={user.name} /> : <span>{getInitials(user.name)}</span>}
                <span className="profile-avatar-status" title="Active account" />
              </div>
              <div className="profile-identity-copy">
                <div className="profile-name-row">
                  <h2>{user.name || 'Account holder'}</h2>
                  <CheckCircle2 size={18} className="lte-text-primary" aria-label="Verified account" />
                </div>
                <p><Mail size={14} /> {user.email}</p>
                <div className="profile-badges">
                  <LteBadge color={roleColor}>{membershipLabel}</LteBadge>
                  <LteBadge color="success">{user.status}</LteBadge>
                </div>
              </div>
              <div className="profile-identity-note">
                <span>Member since</span>
                <strong>{formatDate(user.created_at)}</strong>
              </div>
            </div>

            {editMode ? (
              <form className="profile-form" onSubmit={handleSubmit(saveProfile)}>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label htmlFor="profile-name">Full name</label>
                    <input id="profile-name" className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`} {...register('name', { required: 'Full name is required' })} />
                    {profileErrors.name && <small className="invalid-feedback">{profileErrors.name.message}</small>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-phone">Phone number</label>
                    <input id="profile-phone" className="form-control" placeholder="Add a contact number" {...register('phone')} />
                  </div>
                </div>

                <div className="form-group profile-photo-field">
                  <label>Profile photo</label>
                  <div className="profile-photo-row">
                    <label className="profile-photo-picker">
                      <Camera size={17} />
                      <span>Choose image</span>
                      <input type="file" accept="image/*" onChange={selectPhoto} />
                    </label>
                    <small className="lte-text-muted">JPG, PNG, GIF or WEBP. Maximum 8 MB.</small>
                  </div>
                  {photoFile && (
                    <div className="profile-photo-ready">
                      <UploadCloud size={16} />
                      <span>{photoFile.name}</span>
                      <small>Ready to upload when you save</small>
                    </div>
                  )}
                </div>

                <div className="profile-form-actions">
                  <button type="button" className="btn btn-default" onClick={cancelEditing}>Discard changes</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
                </div>
              </form>
            ) : (
              <dl className="profile-details-grid">
                <div className="profile-detail-item"><dt><UserRound size={15} /> Role</dt><dd>{membershipLabel}</dd></div>
                <div className="profile-detail-item"><dt><Phone size={15} /> Contact number</dt><dd>{user.phone || 'Not specified'}</dd></div>
                <div className="profile-detail-item"><dt><CalendarDays size={15} /> Account created</dt><dd>{formatDate(user.created_at)}</dd></div>
                <div className="profile-detail-item"><dt><KeyRound size={15} /> Login method</dt><dd>{user.login_provider || 'Email / Password'}</dd></div>
              </dl>
            )}
          </AdminCard>

          <AdminCard title="Security & access" icon={<LockKeyhole size={18} />} outline="info">
            <div className="profile-action-list">
              <div className="profile-action-row">
                <span className="profile-action-icon lte-bg-info"><KeyRound size={18} /></span>
                <div><strong>Account password</strong><small>Keep your account protected with a strong password.</small></div>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setChangePasswordOpen(true)}>Update</button>
              </div>
              <div className="profile-action-row">
                <span className="profile-action-icon lte-bg-success"><Laptop size={18} /></span>
                <div><strong>Current session</strong><small>{getDeviceName()} · Active now</small></div>
                <button type="button" className="btn btn-default btn-sm" onClick={async () => { await logout(); navigate('/login') }}><LogOut size={14} /> Sign out</button>
              </div>
            </div>
          </AdminCard>
        </div>

        <aside className="profile-side-column">
          <AdminCard title="Account snapshot" icon={<ShieldCheck size={18} />} outline="success">
            <InfoBox color="success" icon={<CheckCircle2 size={28} />} text="Profile completeness" number={`${profileCompletion}%`} progress={profileCompletion} progressDescription={profileCompletion === 100 ? 'Everything is up to date' : 'Add details to finish your profile'} />
            <div className="profile-snapshot-list">
              <div><span>Email address</span><LteBadge color="success">Verified</LteBadge></div>
              <div><span>Account status</span><LteBadge color={user.status === 'active' ? 'success' : 'warning'}>{user.status}</LteBadge></div>
              <div><span>Login provider</span><strong>{user.login_provider || 'Email'}</strong></div>
            </div>
          </AdminCard>

          <AdminCard title="Membership" icon={<Eye size={18} />} outline="warning">
            <div className="profile-membership">
              <div className="profile-membership-icon"><Eye size={22} /></div>
              <div><strong>{membershipLabel} account</strong><p>{membershipDescription}</p></div>
            </div>
            {!isAdmin && <button type="button" className="btn btn-outline-primary btn-sm profile-full-button" onClick={() => navigate('/subscription-plan')}>Explore membership plans</button>}
          </AdminCard>

          <AdminCard title="Quick navigation" icon={<Clock3 size={18} />}>
            <div className="profile-quick-links">
              <button type="button" onClick={() => navigate('/library')}><Library size={16} /> My library</button>
              <button type="button" onClick={() => navigate('/favorites')}><Heart size={16} /> Favorites</button>
              <button type="button" onClick={() => navigate('/watch-history')}><History size={16} /> Watch history</button>
            </div>
          </AdminCard>

          {!isAdmin && (
            <AdminCard title="Danger zone" icon={<Trash2 size={18} />} outline="danger" className="profile-danger-card">
              <p className="profile-danger-copy">Deleting your account permanently removes your profile, library, and viewing history.</p>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteAccountOpen(true)}><Trash2 size={15} /> Delete account</button>
            </AdminCard>
          )}
        </aside>
      </div>

      <LteDialog open={changePasswordOpen} title="Update password" icon={<KeyRound size={19} />} onClose={() => setChangePasswordOpen(false)}>
        <form onSubmit={handlePasswordSubmit(changePassword)}>
          <div className="form-group">
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" className={`form-control ${passwordErrors.current_password ? 'is-invalid' : ''}`} {...registerPassword('current_password', { required: 'Current password is required' })} />
            {passwordErrors.current_password && <small className="invalid-feedback">{passwordErrors.current_password.message}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" className={`form-control ${passwordErrors.new_password ? 'is-invalid' : ''}`} {...registerPassword('new_password', { required: 'New password is required', minLength: { value: 6, message: 'Use at least 6 characters' } })} />
            {passwordErrors.new_password && <small className="invalid-feedback">{passwordErrors.new_password.message}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" className={`form-control ${passwordErrors.confirm_password ? 'is-invalid' : ''}`} {...registerPassword('confirm_password', { required: 'Please confirm your new password', validate: value => value === getValues('new_password') || 'Passwords do not match' })} />
            {passwordErrors.confirm_password && <small className="invalid-feedback">{passwordErrors.confirm_password.message}</small>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={() => setChangePasswordOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save password</button>
          </div>
        </form>
      </LteDialog>

      <LteDialog open={deleteAccountOpen} title="Delete account" icon={<Trash2 size={19} />} onClose={() => setDeleteAccountOpen(false)}>
        <form onSubmit={handleDeleteSubmit(deleteAccount)}>
          <div className="callout callout-danger">This action is permanent. Your profile, library, favorites, and watch history cannot be restored.</div>
          <div className="form-group">
            <label htmlFor="delete-password">Enter your password to continue</label>
            <input id="delete-password" type="password" className={`form-control ${deleteErrors.password ? 'is-invalid' : ''}`} {...registerDelete('password', { required: 'Password is required' })} />
            {deleteErrors.password && <small className="invalid-feedback">{deleteErrors.password.message}</small>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={() => setDeleteAccountOpen(false)}>Keep account</button>
            <button type="submit" className="btn btn-danger">Delete permanently</button>
          </div>
        </form>
      </LteDialog>
    </AdminLTE>
  )
}
