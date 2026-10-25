import { EmptyState } from '../components/EmptyState';
import { useState } from 'react';
import { ArrowLeft, Pin, Plus, Search, Trash2 } from 'lucide-react';
import type { LifePageProps } from '../components/LifeUI';
import { useLifeLanguage } from '../lifeI18n';
export default function Notes({
  data,
  update,
  openNote,
  selectedId,
  setSelectedId,
  confirmDelete,
}: LifePageProps & {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  confirmDelete: (fn: () => void) => void;
}) {
  const { t, l, locale } = useLifeLanguage();
  const [query, setQuery] = useState('');
  const selected = data.notes?.find((n) => n.id === selectedId);
  const notes = [...(data.notes ?? [])]
    .filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  function edit(field: 'title' | 'content', value: string) {
    update((d) => ({
      ...d,
      notes: d.notes?.map((n) =>
        n.id === selectedId ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n,
      ),
    }));
  }
  if (!data.notes?.length)
    return (
      <section className="life-card">
        <EmptyState
          title={l.noNotes}
          description={l.notesEmptyHint}
          action={l.createNote}
          icon={Plus}
          onAction={() => openNote()}
        />
      </section>
    );
  return (
    <div className={`notes-layout ${selected ? 'note-is-open' : ''}`}>
      <section className="life-card notes-list">
        <div className="notes-list-header">
          <label className="note-search">
            <Search size={17} />
            <input
              aria-label={l.searchNotes}
              placeholder={l.searchNotes}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button className="icon-button" aria-label={l.newNote} onClick={() => openNote()}>
            <Plus size={19} />
          </button>
        </div>
        {notes.map((note) => (
          <button
            className={`note-list-item ${note.id === selectedId ? 'selected-note' : ''}`}
            key={note.id}
            onClick={() => setSelectedId(note.id)}
          >
            <strong>
              {note.pinned && <Pin size={12} />} {note.title || l.untitled}
            </strong>
            <p>{note.content.slice(0, 80) || l.noteEmpty}</p>
            <small>
              {new Date(note.updatedAt).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
              })}
            </small>
          </button>
        ))}
        {!notes.length && <p className="list-empty">{l.noNotes}</p>}
      </section>
      <section className="life-card note-editor">
        {selected ? (
          <>
            <div className="note-editor-toolbar">
              <button className="note-back quiet-button" onClick={() => setSelectedId(null)}>
                <ArrowLeft size={16} />
                {l.back}
              </button>
              <span className="note-save-status">{l.autosaved}</span>
              <button
                className={`icon-button ${selected.pinned ? 'is-pinned' : ''}`}
                aria-label={selected.pinned ? l.unpin : l.pin}
                onClick={() =>
                  update((d) => ({
                    ...d,
                    notes: d.notes?.map((n) =>
                      n.id === selected.id
                        ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
                        : n,
                    ),
                  }))
                }
              >
                <Pin size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={l.deleteNote}
                onClick={() =>
                  confirmDelete(() => {
                    update((d) => ({ ...d, notes: d.notes?.filter((n) => n.id !== selected.id) }));
                    setSelectedId(null);
                  })
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
            <input
              className="note-title-input"
              key={selected.id}
              autoFocus
              aria-label={t.title}
              value={selected.title}
              placeholder={l.untitled}
              maxLength={160}
              onChange={(e) => edit('title', e.target.value)}
            />
            <div className="note-dates">
              {new Date(selected.updatedAt).toLocaleString(locale, {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <textarea
              className="note-content-input"
              aria-label={t.description}
              placeholder={l.notePlaceholder}
              value={selected.content}
              maxLength={50000}
              onChange={(e) => edit('content', e.target.value)}
            />
          </>
        ) : (
          <div className="note-placeholder">
            <p>{l.noNoteSelected}</p>
            <button className="button secondary" onClick={() => openNote()}>
              <Plus size={17} />
              {l.newNote}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
