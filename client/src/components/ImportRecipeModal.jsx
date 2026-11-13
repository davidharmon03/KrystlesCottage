import { useState } from 'react'
import { X, Loader, AlertCircle, Plus, Link, Image, Camera, Upload } from 'lucide-react'
import api from '../api'

// Shrink a phone photo before upload (also turns iPhone HEIC into JPEG).
async function shrinkPhoto(file, maxSide = 2400) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9))
    return blob || file
  } catch {
    return file
  }
}

const TAGS = [
  'healthy',
  'organic',
  'freezer-friendly',
  'vegan',
  'protein',
  'garden',
  'batch prep',
  'quick',
]
const SKILL_TAGS = [
  'flash freeze',
  'vacuum seal',
  'slow cook',
  'batch prep',
  'sous vide',
  'ferment',
  'dehydrate',
]

export default function ImportRecipeModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState('input') // 'input' | 'preview'
  const [mode, setMode] = useState('link') // 'link' | 'photo'
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [partial, setPartial] = useState(false)
  const [fromPhoto, setFromPhoto] = useState(false)
  const [lowConfidence, setLowConfidence] = useState(false)
  const [form, setForm] = useState(null)

  const handleImport = async e => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/recipes/import-url', { url: url.trim() })
      fillForm(res.data, url.trim())
    } catch (err) {
      setError(
        err.response?.data?.error || "We couldn't read that page. Try copying the recipe manually."
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePhoto = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('image', await shrinkPhoto(file), 'recipe.jpg')
      const res = await api.post('/recipes/import-photo', body, { timeout: 120000 })
      fillForm(res.data, '')
    } catch (err) {
      setError(err.response?.data?.error || "We couldn't read that photo. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fillForm = (data, sourceUrl) => {
    setPartial(!!data._partial)
    setFromPhoto(!!data._photo)
    setLowConfidence(!!data._lowConfidence)
    setForm({
      title: data.title || '',
      description: data.description || '',
      ingredients: (data.ingredients || []).join('\n'),
      steps: (data.steps || []).join('\n'),
      tags: data.tags || [],
      skill_tags: data.skill_tags || [],
      sides: data.sides || '',
      is_public: data.is_public || false,
      servings: data.servings || '',
      imageUrl: data.imageUrl || '',
      prepTime: data.prepTime != null ? String(data.prepTime) : '',
      cookTime: data.cookTime != null ? String(data.cookTime) : '',
      source_url: data.source_url || sourceUrl,
      source_note: '',
    })
    setStep('preview')
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      // Append source credit to description / notes
      const sourceNote = form.source_url
        ? `\n\nImported from: ${form.source_url}`
        : form.source_note.trim()
          ? `\n\nFrom: ${form.source_note.trim()}`
          : ''
      const payload = {
        title: form.title,
        description: (form.description + sourceNote).trim(),
        ingredients: form.ingredients
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        steps: form.steps
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        tags: form.tags,
        skill_tags: form.skill_tags,
        sides: form.sides.trim(),
        is_public: form.is_public,
        servings: form.servings,
        prep_time: form.prepTime,
        cook_time: form.cookTime,
      }
      await onSave(payload)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('input')
    setMode('link')
    setUrl('')
    setForm(null)
    setError('')
    setPartial(false)
    setFromPhoto(false)
    setLowConfidence(false)
    onClose()
  }

  const toggleTag = (tag, field) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(tag) ? f[field].filter(t => t !== tag) : [...f[field], tag],
    }))
  }

  const sourceDomain = (() => {
    try {
      return new URL(form?.source_url || url).hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  })()

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-xl font-serif font-semibold text-ink flex items-center gap-2">
            {(step === 'input' ? mode === 'photo' : fromPhoto) ? (
              <Camera size={17} className="text-moss-500" />
            ) : (
              <Link size={17} className="text-moss-500" />
            )}
            {step === 'input' ? 'Import a Recipe' : 'Review Imported Recipe'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Step 1: choose link or photo ─────────────────────── */}
          {step === 'input' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              {[
                ['link', 'From a link', Link],
                ['photo', 'From a photo', Camera],
              ].map(([m, label, Icon]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m)
                    setError('')
                  }}
                  disabled={loading}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === m ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 1b: photo ────────────────────────────────────── */}
          {step === 'input' && mode === 'photo' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
                  <Loader size={22} className="animate-spin text-moss-500" />
                  <p className="text-sm">Reading your photo… this can take up to a minute.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="btn-primary flex items-center justify-center gap-2 cursor-pointer">
                    <Camera size={14} /> Take a photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                  </label>
                  <label className="btn-ghost flex items-center justify-center gap-2 cursor-pointer border border-slate-200">
                    <Upload size={14} /> Choose a photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>
                </div>
              )}
              <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                <li>Works with printed recipes — cookbooks, magazines, printouts.</li>
                <li>Lay the page flat, use good light, and take the photo straight on.</li>
                <li>One recipe per photo. You'll check everything before it's saved.</li>
                <li>Handwritten cards don't read well yet.</li>
              </ul>
              <button type="button" onClick={handleClose} className="btn-ghost w-full">
                Cancel
              </button>
            </div>
          )}

          {/* ── Step 1a: URL input ────────────────────────────────── */}
          {step === 'input' && mode === 'link' && (
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="label">Recipe URL</label>
                <input
                  type="url"
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={url}
                  onChange={e => {
                    setUrl(e.target.value)
                    setError('')
                  }}
                  className="input"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                Paste a link from AllRecipes, NYT Cooking, Serious Eats, Food Network, or any site
                with recipe data.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={handleClose} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={14} className="animate-spin" /> Importing…
                    </>
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Preview & edit ────────────────────────────── */}
          {step === 'preview' && form && (
            <div className="space-y-4">
              {/* Photo: always check */}
              {fromPhoto && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {lowConfidence
                      ? 'That photo was hard to read, so expect mistakes. '
                      : 'Read from your photo. '}
                    Check every line before saving, especially amounts and numbers.
                    {partial &&
                      " We couldn't tell the ingredients from the steps — move lines where they belong."}
                  </p>
                </div>
              )}

              {/* Partial data warning (link) */}
              {partial && !fromPhoto && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    We grabbed the title and image but couldn't find full recipe data on that page.
                    Fill in the ingredients and steps below before saving.
                  </p>
                </div>
              )}

              {/* Image preview */}
              {form.imageUrl && (
                <div className="-mx-5 -mt-5 mb-0">
                  <img
                    src={form.imageUrl}
                    alt={form.title}
                    className="w-full max-h-48 object-cover"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="A short description…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Servings / times row */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">Servings</label>
                  <input
                    type="number"
                    className="input"
                    value={form.servings}
                    onChange={e => setForm(f => ({ ...f, servings: e.target.value }))}
                    placeholder="—"
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="label">Prep (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.prepTime}
                    onChange={e => setForm(f => ({ ...f, prepTime: e.target.value }))}
                    placeholder="—"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Cook (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.cookTime}
                    onChange={e => setForm(f => ({ ...f, cookTime: e.target.value }))}
                    placeholder="—"
                    min={0}
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="label">Ingredients</label>
                <textarea
                  className="input resize-none"
                  rows={6}
                  value={form.ingredients}
                  onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                  placeholder="One ingredient per line"
                />
                <p className="text-xs text-slate-400 mt-1">One per line</p>
              </div>

              {/* Steps */}
              <div>
                <label className="label">Steps</label>
                <textarea
                  className="input resize-none"
                  rows={6}
                  value={form.steps}
                  onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
                  placeholder="One step per line"
                />
                <p className="text-xs text-slate-400 mt-1">One per line</p>
              </div>

              {/* Where it came from (photo) */}
              {fromPhoto && (
                <div>
                  <label className="label">Where's it from?</label>
                  <input
                    type="text"
                    className="input"
                    value={form.source_note}
                    onChange={e => setForm(f => ({ ...f, source_note: e.target.value }))}
                    placeholder="e.g. Joy of Cooking, page 212"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Optional — saved with the description
                  </p>
                </div>
              )}

              {/* Suggested Sides */}
              <div>
                <label className="label">Suggested Sides</label>
                <input
                  type="text"
                  className="input"
                  value={form.sides}
                  onChange={e => setForm(f => ({ ...f, sides: e.target.value }))}
                  placeholder="e.g. roasted vegetables, rice pilaf, garlic bread"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Optional — side dishes that pair well with this entrée
                </p>
              </div>

              {/* Image URL */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Image size={12} /> Image URL
                </label>
                <input
                  type="url"
                  className="input"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="mt-2 h-16 w-24 object-cover rounded-lg border border-slate-200"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>

              {/* Recipe tags */}
              <div>
                <label className="label">Recipe tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TAGS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t, 'tags')}
                      className={`tag cursor-pointer transition-colors ${
                        form.tags.includes(t)
                          ? 'bg-moss-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-moss-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill tags */}
              <div>
                <label className="label">Skill tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SKILL_TAGS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t, 'skill_tags')}
                      className={`tag cursor-pointer transition-colors ${
                        form.skill_tags.includes(t)
                          ? 'bg-terra-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-terra-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="import_is_public"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="import_is_public" className="text-sm text-slate-600">
                  Make recipe public
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input')
                    setError('')
                  }}
                  className="btn-ghost flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !form.title || !form.ingredients || !form.steps}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Save Recipe
                    </>
                  )}
                </button>
              </div>

              {/* Attribution */}
              {sourceDomain && (
                <p className="text-xs text-slate-400 text-center pt-1">
                  Imported from{' '}
                  <a
                    href={form.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-600"
                  >
                    {sourceDomain}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
