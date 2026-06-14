import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { apiFetch } from '../../api'

function MemoCard({ memo, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="bg-[#16161f] border border-white/6 rounded-xl p-4 group">
      <p className="text-white/70 text-base leading-relaxed whitespace-pre-line">{memo.content}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/4">
        <span className="text-sm text-white/20">
          {new Date(memo.updatedAt).toLocaleDateString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirm ? (
            <>
              <span className="text-xs text-white/40 mr-1">삭제?</span>
              <button
                onClick={() => onDelete(memo.memoId)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(memo)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirm(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EditModal({ memo, onSave, onClose }) {
  const [content, setContent] = useState(memo?.content ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    await onSave(content)
    setSaving(false)
  }

  return (
    <div className="absolute inset-0 z-10 bg-[#0c0c15]/90 backdrop-blur-sm flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-white text-base font-medium">
          {memo ? '메모 수정' : '새 메모'}
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <textarea
        autoFocus
        className="flex-1 w-full bg-[#16161f] border border-white/8 focus:border-indigo-500/50 rounded-xl p-4 text-white/80 text-base leading-7 resize-none outline-none placeholder:text-white/20 transition-colors"
        placeholder="자유롭게 메모를 남겨보세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        onClick={handleSave}
        disabled={saving || !content.trim()}
        className="w-full py-3 rounded-xl text-base font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shrink-0"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        저장
      </button>
    </div>
  )
}

export default function MemoTab({ novelId, currentEpisode }) {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(undefined)

  useEffect(() => {
    if (!novelId) return
    fetchMemos()
  }, [novelId, currentEpisode])

  const fetchMemos = async () => {
    setLoading(true)
    try {
      const all = await apiFetch(`/api/memo?novelId=${novelId}`)
      setMemos(all.filter((m) => m.episodeNumber === currentEpisode))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (content) => {
    if (editTarget === null) {
      await apiFetch('/api/memo', {
        method: 'POST',
        body: JSON.stringify({ novelId, content, episodeNumber: currentEpisode }),
      })
    } else {
      await apiFetch(`/api/memo/${editTarget.memoId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
    }
    setEditTarget(undefined)
    fetchMemos()
  }

  const handleDelete = async (memoId) => {
    await apiFetch(`/api/memo/${memoId}`, { method: 'DELETE' }).catch(console.error)
    fetchMemos()
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <span className="text-white/60 text-base font-medium">{currentEpisode}화 메모</span>
          {memos.length > 0 && (
            <span className="ml-2 text-xs text-white/25 bg-white/5 px-1.5 py-0.5 rounded-full">
              {memos.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center gap-1.5 text-base text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 메모
        </button>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-base">불러오는 중</span>
          </div>
        ) : memos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25">
            <p className="text-base">저장된 메모가 없습니다.</p>
            <button
              onClick={() => setEditTarget(null)}
              className="flex items-center gap-1.5 text-base text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              첫 메모 작성
            </button>
          </div>
        ) : (
          memos.map((memo) => (
            <MemoCard
              key={memo.memoId}
              memo={memo}
              onEdit={(m) => setEditTarget(m)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {editTarget !== undefined && (
        <EditModal
          memo={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(undefined)}
        />
      )}
    </div>
  )
}
