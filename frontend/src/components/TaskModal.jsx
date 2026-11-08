import { useEffect, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { Avatar, Field, ProgressBar, Spinner, btnDanger, btnGhost, btnPrimary, inputCls } from './ui';
import { PRIORITIES, STATUSES, fmtRelative } from '../utils/format';
import { addComment, addSubtask, createTask, deleteSubtask, errMsg, getTask, setSubtaskDone, updateTask } from '../services/api';
import { useLookups } from '../hooks/useLookups';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';

const blank = (d = {}) => ({
  title: '', description: '', project_id: d.project_id ?? '', category_id: d.category_id ?? '',
  assignee_id: d.assignee_id ?? '', status: d.status ?? 'todo', priority: 'medium',
  start_date: '', due_date: d.due_date ?? '',
});

const fromTask = (t) => ({
  title: t.title, description: t.description || '', project_id: t.project_id, category_id: t.category_id ?? '',
  assignee_id: t.assignee_id ?? '', status: t.status, priority: t.priority,
  start_date: t.start_date || '', due_date: t.due_date || '',
});

export default function TaskModal({ open, taskId, defaults, onClose, onChanged, onDelete }) {
  const { projects, team, categories } = useLookups();
  const { activeMember } = useSettings();
  const toast = useToast();
  const isEdit = Boolean(taskId);

  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSub, setNewSub] = useState('');
  const [newComment, setNewComment] = useState('');
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setTab('details'); setDirty(false); setNewSub(''); setNewComment(''); setLoadError(null); setTask(null);
    setSubtasks([]); setComments([]);
    if (!taskId) { setForm(blank({ ...defaults, project_id: defaults?.project_id ?? projects[0]?.id ?? '' })); return; }
    setLoading(true);
    getTask(taskId)
      .then((t) => { setTask(t); setForm(fromTask(t)); setSubtasks(t.subtasks); setComments(t.comments); })
      .catch((e) => setLoadError(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => { if (dirty) onChanged?.(); onClose(); };

  async function save() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Enter a task title.';
    if (!form.project_id) errs.project_id = 'Choose a project.';
    if (form.start_date && form.due_date && form.due_date < form.start_date) errs.due_date = 'Due date must be on or after the start date.';
    setErrors(errs);
    if (Object.keys(errs).length) { setTab('details'); return; }

    const payload = {
      ...form,
      title: form.title.trim(),
      project_id: Number(form.project_id),
      category_id: form.category_id ? Number(form.category_id) : null,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateTask(taskId, payload);
        toast.success('Task saved');
      } else {
        const created = await createTask(payload);
        await Promise.all(subtasks.map((s) => addSubtask(created.id, s.title)));
        toast.success('Task created');
      }
      onChanged?.();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function addSub() {
    const title = newSub.trim();
    if (!title) return;
    if (!isEdit) { setSubtasks((l) => [...l, { id: `new-${l.length}-${Date.now()}`, title, is_done: false }]); setNewSub(''); return; }
    try {
      const s = await addSubtask(taskId, title);
      setSubtasks((l) => [...l, s]); setNewSub(''); setDirty(true);
    } catch (e) { toast.error(errMsg(e)); }
  }

  async function toggleSub(s) {
    try {
      const u = await setSubtaskDone(s.id, !s.is_done);
      setSubtasks((l) => l.map((x) => (x.id === s.id ? u : x))); setDirty(true);
    } catch (e) { toast.error(errMsg(e)); }
  }

  async function removeSub(s) {
    if (!isEdit) { setSubtasks((l) => l.filter((x) => x.id !== s.id)); return; }
    try {
      await deleteSubtask(s.id);
      setSubtasks((l) => l.filter((x) => x.id !== s.id)); setDirty(true);
    } catch (e) { toast.error(errMsg(e)); }
  }

  async function postComment() {
    const body = newComment.trim();
    if (!body) return;
    try {
      const c = await addComment(taskId, body, activeMember?.id ?? null);
      setComments((l) => [...l, c]); setNewComment(''); setDirty(true);
    } catch (e) { toast.error(errMsg(e)); }
  }

  const done = subtasks.filter((s) => s.is_done).length;
  const tabs = [
    ['details', 'Details'],
    ['subtasks', `Subtasks${subtasks.length ? ` (${done}/${subtasks.length})` : ''}`],
    ...(isEdit ? [['comments', `Comments${comments.length ? ` (${comments.length})` : ''}`]] : []),
  ];

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit task' : 'New task'}
      onClose={close}
      footer={<>
        {isEdit && task && (
          <button className={`${btnDanger} mr-auto`} onClick={() => onDelete?.(task)} disabled={saving}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
        <button className={btnGhost} onClick={close} disabled={saving}>Cancel</button>
        <button className={btnPrimary} onClick={save} disabled={saving || loading || Boolean(loadError)}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </button>
      </>}
    >
      {loading ? <Spinner /> : loadError ? <p className="py-8 text-center text-sm text-rose-600">{loadError}</p> : (
        <>
          <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
            {tabs.map(([key, label]) => (
              <button
                key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >{label}</button>
            ))}
          </div>

          {tab === 'details' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" error={errors.title} className="sm:col-span-2">
                <input className={inputCls} value={form.title} onChange={set('title')} placeholder="e.g. Design onboarding screens" maxLength={200} autoFocus />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} placeholder="What needs to be done?" />
              </Field>
              <Field label="Project" error={errors.project_id}>
                <select className={inputCls} value={form.project_id} onChange={set('project_id')}>
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Assignee">
                <select className={inputCls} value={form.assignee_id} onChange={set('assignee_id')}>
                  <option value="">Unassigned</option>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={set('status')}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputCls} value={form.priority} onChange={set('priority')}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className={inputCls} value={form.category_id} onChange={set('category_id')}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date"><input type="date" className={inputCls} value={form.start_date} onChange={set('start_date')} /></Field>
                <Field label="Due date" error={errors.due_date}><input type="date" className={inputCls} value={form.due_date} onChange={set('due_date')} /></Field>
              </div>
            </div>
          )}

          {tab === 'subtasks' && (
            <div>
              {subtasks.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <ProgressBar value={Math.round((done / subtasks.length) * 100)} className="flex-1" />
                  <span className="text-xs font-medium text-slate-500">{done} of {subtasks.length} done</span>
                </div>
              )}
              <ul className="space-y-1.5">
                {subtasks.map((s) => (
                  <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
                    <input
                      type="checkbox" checked={s.is_done} disabled={!isEdit} onChange={() => toggleSub(s)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" aria-label={`Mark "${s.title}" done`}
                    />
                    <span className={`flex-1 text-sm ${s.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{s.title}</span>
                    <button onClick={() => removeSub(s)} aria-label={`Remove ${s.title}`} className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {subtasks.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No subtasks yet. Break the task into smaller steps below.</p>}
              <div className="mt-3 flex gap-2">
                <input
                  className={inputCls} value={newSub} placeholder="Add a subtask" maxLength={200}
                  onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSub())}
                />
                <button className={btnGhost} onClick={addSub} disabled={!newSub.trim()}><Plus className="h-4 w-4" /> Add</button>
              </div>
            </div>
          )}

          {tab === 'comments' && (
            <div>
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <Avatar name={c.author_name || 'Guest'} color={c.author_color || '#98A2B3'} size={32} />
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-slate-50 px-4 py-2.5">
                      <p className="text-xs text-slate-500"><span className="font-semibold text-slate-800">{c.author_name || 'Guest'}</span> · {fmtRelative(c.created_at)}</p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {comments.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No comments yet. Start the discussion below.</p>}
              <div className="mt-4 flex items-start gap-3">
                <Avatar name={activeMember?.name || 'Guest'} color={activeMember?.avatar_color} size={32} />
                <textarea
                  className={inputCls} rows={2} value={newComment} placeholder={`Comment as ${activeMember?.name || 'Guest'}`} maxLength={2000}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className={btnPrimary} onClick={postComment} disabled={!newComment.trim()} aria-label="Post comment"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
