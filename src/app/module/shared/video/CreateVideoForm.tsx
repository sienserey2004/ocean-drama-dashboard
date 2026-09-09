import { useEffect, useRef, useState } from 'react'
import {
  Check, CheckCircle, FileImage, Info, Layers, Loader2,
  RotateCcw, Send, Tags, Trash2, Upload,
} from 'lucide-react'
import toast from '@/app/utils/toast'
import { categoryApi, tagApi } from '@/app/api/categoryTag.service'
import { videoApi } from '@/app/api/video.service'
import type { Category, Tag } from '@/app/types'
import { AdminCard, LteBadge } from '@/app/module/shared/adminlte'

interface SelectOption {
  id: number
  name: string
}

interface OptionSelectorProps {
  label: string
  hint: string
  options: SelectOption[]
  selected: number[]
  onChange: (ids: number[]) => void
}

function OptionSelector({ label, hint, options, selected, onChange }: OptionSelectorProps) {
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id])
  }

  return (
    <fieldset className="create-option-fieldset">
      <legend>{label}</legend>
      <p>{hint}</p>
      <div className="create-option-list">
        {options.length === 0 ? (
          <span className="lte-text-muted text-sm">No options available.</span>
        ) : options.map(option => {
          const active = selected.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              className={`create-option ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(option.id)}
            >
              <span className="create-option-check">{active && <Check size={12} />}</span>
              {option.name}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && <small>{selected.length} selected</small>}
    </fieldset>
  )
}

export default function CreateVideoForm() {
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([categoryApi.list(), tagApi.list()])
      .then(([categoryResponse, tagResponse]) => {
        setCategories(categoryResponse.data || [])
        setTags(tagResponse.data || [])
      })
      .catch(() => toast.error('Categories and tags could not be loaded'))
      .finally(() => setOptionsLoading(false))
  }, [])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const chooseThumbnail = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Thumbnail must be smaller than 10 MB')
      return
    }
    setThumbnail(file)
    setPreview(URL.createObjectURL(file))
    setSubmitted(false)
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSelectedCategories([])
    setSelectedTags([])
    setSubmitted(false)
    removeThumbnail()
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!title.trim() || !thumbnail) {
      toast.error(!title.trim() ? 'Title is required' : 'Thumbnail is required')
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('thumbnail', thumbnail)
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('category_ids', selectedCategories.join(','))
    formData.append('tag_ids', selectedTags.join(','))

    try {
      const response = await videoApi.createMultipart(formData)
      toast.success(response.message || 'Series created and submitted for review')
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create series')
    } finally {
      setSubmitting(false)
    }
  }

  const titleInvalid = submitted && !title.trim()
  const thumbnailInvalid = submitted && !thumbnail

  return (
    <form onSubmit={submit} className="create-video-layout">
      <div className="create-video-main">
        <AdminCard
          title="Series information"
          icon={<Layers size={17} />}
          outline="primary"
          tools={<LteBadge color="primary">Required</LteBadge>}
        >
          <div className="create-video-grid">
            <div>
              <div className="form-group mb-0">
                <label>Thumbnail artwork *</label>
                <div
                  className={`create-upload-zone ${dragging ? 'dragging' : ''} ${thumbnailInvalid ? 'is-invalid' : ''}`}
                  onDragEnter={event => { event.preventDefault(); setDragging(true) }}
                  onDragOver={event => event.preventDefault()}
                  onDragLeave={event => { event.preventDefault(); setDragging(false) }}
                  onDrop={event => {
                    event.preventDefault()
                    setDragging(false)
                    const file = event.dataTransfer.files[0]
                    if (file) chooseThumbnail(file)
                  }}
                >
                  {preview ? (
                    <div className="create-upload-preview">
                      <img src={preview} alt="Selected thumbnail preview" />
                      <div className="create-upload-meta">
                        <div>
                          <strong>{thumbnail?.name}</strong>
                          <small>{thumbnail ? `${(thumbnail.size / 1024 / 1024).toFixed(2)} MB` : ''}</small>
                        </div>
                        <button type="button" className="btn btn-danger btn-sm" onClick={removeThumbnail}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="create-upload-prompt" onClick={() => fileInputRef.current?.click()}>
                      <span className="create-upload-icon lte-bg-primary"><Upload size={30} /></span>
                      <strong>Drop an image here or click to browse</strong>
                      <small>Recommended 1280 × 720, JPG or PNG, up to 10 MB</small>
                      <span className="btn btn-primary btn-sm"><FileImage size={14} /> Choose image</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={event => event.target.files?.[0] && chooseThumbnail(event.target.files[0])}
                  />
                </div>
                {thumbnailInvalid && <small className="invalid-feedback">A thumbnail image is required.</small>}
              </div>
            </div>

            <div>
              <div className="form-group">
                <label htmlFor="series-title">Series title *</label>
                <input
                  id="series-title"
                  className={`form-control ${titleInvalid ? 'is-invalid' : ''}`}
                  placeholder="Example: Master of the Seven Seas"
                  maxLength={255}
                  value={title}
                  onChange={event => { setTitle(event.target.value); setSubmitted(false) }}
                />
                <div className="field-meta">
                  {titleInvalid ? <small className="invalid-feedback">A title is required.</small> : <small>Use a clear, searchable title.</small>}
                  <small>{title.length}/255</small>
                </div>
              </div>

              <div className="form-group mb-0">
                <label htmlFor="series-description">Series overview</label>
                <textarea
                  id="series-description"
                  className="form-control textarea-control"
                  rows={7}
                  placeholder="Write a compelling synopsis for viewers..."
                  maxLength={2000}
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                />
                <div className="field-meta"><small>Optional, but recommended.</small><small>{description.length}/2000</small></div>
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Classification" icon={<Tags size={17} />} outline="info">
          {optionsLoading ? (
            <div className="create-options-loading"><Loader2 size={22} className="animate-spin" /> Loading categories and tags...</div>
          ) : (
            <div className="create-classification-grid">
              <OptionSelector
                label="Categories"
                hint="Choose the genres that best describe this series."
                options={categories.map(category => ({ id: category.category_id, name: category.name }))}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
              <OptionSelector
                label="Tags"
                hint="Add labels that help viewers discover the series."
                options={tags.map(tag => ({ id: tag.tag_id, name: tag.name }))}
                selected={selectedTags}
                onChange={setSelectedTags}
              />
            </div>
          )}
        </AdminCard>

        <AdminCard bodyClassName="create-form-actions">
          <button type="button" className="btn btn-default" disabled={submitting} onClick={resetForm}>
            <RotateCcw size={15} /> Reset form
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit for review</>}
          </button>
        </AdminCard>
      </div>

      <aside className="create-video-sidebar">
        <AdminCard title="Publishing checklist" icon={<CheckCircle size={17} />} outline="success">
          <ul className="publish-checklist">
            <ChecklistItem complete={!!thumbnail} text="Thumbnail selected" />
            <ChecklistItem complete={!!title.trim()} text="Series title added" />
            <ChecklistItem complete={!!description.trim()} text="Overview completed" optional />
            <ChecklistItem complete={selectedCategories.length > 0} text="Category selected" optional />
            <ChecklistItem complete={selectedTags.length > 0} text="Discovery tags added" optional />
          </ul>
        </AdminCard>

        <AdminCard title="What happens next?" icon={<Info size={17} />} outline="warning">
          <ol className="publish-steps">
            <li><span>1</span><div><strong>Submit</strong><small>Your series is saved as pending.</small></div></li>
            <li><span>2</span><div><strong>Review</strong><small>An administrator checks the content.</small></div></li>
            <li><span>3</span><div><strong>Add episodes</strong><small>Open the video library to manage episodes.</small></div></li>
          </ol>
          <div className="callout callout-info">You can edit series details while the submission is waiting for review.</div>
        </AdminCard>
      </aside>
    </form>
  )
}

function ChecklistItem({ complete, text, optional = false }: { complete: boolean; text: string; optional?: boolean }) {
  return (
    <li className={complete ? 'complete' : ''}>
      <span>{complete && <Check size={13} />}</span>
      <div><strong>{text}</strong>{optional && <small>Recommended</small>}</div>
    </li>
  )
}
