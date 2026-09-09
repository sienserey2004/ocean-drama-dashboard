import { ArrowLeft, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AdminLTE, ContentHeader } from '@/app/module/shared/adminlte'
import CreateVideoForm from './CreateVideoForm'

export default function CreateVideoPage() {
  const navigate = useNavigate()

  return (
    <AdminLTE className="-m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title="Add New Video"
        description="Create a series record and submit it for platform review."
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Videos', to: '/dashboard/videos' },
          { label: 'Add New' },
        ]}
        actions={
          <button type="button" className="btn btn-default btn-sm" onClick={() => navigate('/dashboard/videos')}>
            <ArrowLeft size={15} /> Back to videos
          </button>
        }
      />

      <div className="create-video-heading">
        <span className="lte-bg-primary"><PlusCircle size={24} /></span>
        <div>
          <strong>New series submission</strong>
          <small>Fields marked with an asterisk are required.</small>
        </div>
      </div>

      <CreateVideoForm />
    </AdminLTE>
  )
}
