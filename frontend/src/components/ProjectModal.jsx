import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Field, btnGhost, btnPrimary, inputCls } from './ui';
import { PROJECT_COLORS, PROJECT_STATUSES } from '../utils/format';
import { createProject, errMsg, updateProject } from '../services/api';
import { useToast } from '../hooks/useToast';

const blank = { name: '', description: '', status: 'active', color: PROJECT_COLORS[0], start_date: '', due_date: '' };

export default function ProjectModal({ open, project, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(project ? {
      name: project.name, description: project.description || '', status: project.status, color: project.color,
      start_date: project.start_date || '', due_date: project.due_date || '',
    } : blank);
  }, [open, project]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter a project name.';
    if (form.start_date && form.due_date && form.due_date < form.start_date) errs.due_date = 'Due date must be on or after the start date.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), start_date: form.start_date || null, due_date: form.due_date || null };
      const saved = project ? await updateProject(project.id, payload) : await createProject(payload);
      toast.success(project ? 'Project saved' : 'Project created');
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose} title={project ? 'Edit project' : 'New project'} size="max-w-xl"
      footer={<>
        <button className={btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
        <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : project ? 'Save changes' : 'Create project'}</button>
      </>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" error={errors.name} className="sm:col-span-2">
          <input className={inputCls} value={form.name} onChange={set('name')} maxLength={100} placeholder="e.g. Customer Portal" autoFocus />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} placeholder="What is this project about?" />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={set('status')}>
            {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Colour</span>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))} aria-label={`Colour ${c}`} aria-pressed={form.color === c}
                className={`h-8 w-8 rounded-full ring-offset-2 transition ${form.color === c ? 'ring-2 ring-slate-800' : 'hover:scale-110'}`} style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <Field label="Start date"><input type="date" className={inputCls} value={form.start_date} onChange={set('start_date')} /></Field>
        <Field label="Due date" error={errors.due_date}><input type="date" className={inputCls} value={form.due_date} onChange={set('due_date')} /></Field>
      </div>
    </Modal>
  );
}
