"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { formatTimeAgo } from "@/lib/shared/format";

const MAX = 2000;

// Owns its own text so typing re-renders only this form, not the whole thread.
function PostForm({ id, label, placeholder, submitLabel, onSubmit, onCancel, autoFocus = false }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write something first.");
      return;
    }
    setError("");
    setSaving(true);
    const problem = await onSubmit(text.trim());
    if (problem) {
      setError(problem);
      setSaving(false);
    } else {
      setText("");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextareaField
        id={id}
        label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
        helper={`${text.length} / ${MAX}`}
        maxLength={MAX}
        autoFocus={autoFocus}
        className="h-[96px]"
      />
      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function Byline({ post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Avatar name={post.author.name} photourl={post.author.photourl} size="sm" />
      <span className="font-semibold">{post.author.name}</span>
      {post.author.isInstructor && <span className="rounded-xs bg-t1 px-2 py-0.5 text-caption text-accent-light">Instructor</span>}
      <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()} className="text-small text-muted">
        {formatTimeAgo(post.createdAt)}
      </time>
    </div>
  );
}

function DeleteButton({ post, label, onClick }) {
  if (!post.canDelete) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-light"
    >
      <Icon name="delete-row" size={20} />
    </button>
  );
}

/** The questions and answers for one lecture. Mounted per lecture (keyed by the caller), so state never leaks between lectures. */
export function QaPanel({ lectureId, onTotal }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [toDelete, setToDelete] = useState(null); // { post, parentId|null }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api(`/qna/lecture/${lectureId}`)
      .then((res) => {
        if (cancelled) return;
        setFailed(false);
        setData(res);
        onTotal?.(res.total);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lectureId, nonce, onTotal]);

  const closeDelete = useCallback(() => setToDelete(null), []);

  async function ask(body) {
    try {
      const res = await api(`/qna/lecture/${lectureId}`, { method: "POST", body: { body } });
      setData((d) => ({ ...d, total: d.total + 1, questions: [res.question, ...d.questions] }));
      onTotal?.(data.total + 1);
      return null;
    } catch (err) {
      return err.errors?.body?.[0] ?? err.message;
    }
  }

  async function sendReply(question, body) {
    try {
      const res = await api(`/qna/${question.id}/replies`, { method: "POST", body: { body } });
      setData((d) => ({ ...d, questions: d.questions.map((q) => (q.id === question.id ? { ...q, replies: [...q.replies, res.reply] } : q)) }));
      setReplyingTo(null);
      return null;
    } catch (err) {
      return err.errors?.body?.[0] ?? err.message;
    }
  }

  async function confirmDelete() {
    const { post, parentId } = toDelete;
    setDeleting(true);
    try {
      await api(`/qna/${post.id}`, { method: "DELETE" });
      setData((d) => ({
        ...d,
        total: parentId ? d.total : d.total - 1,
        questions: parentId
          ? d.questions.map((q) => (q.id === parentId ? { ...q, replies: q.replies.filter((r) => r.id !== post.id) } : q))
          : d.questions.filter((q) => q.id !== post.id),
      }));
      if (!parentId) onTotal?.(data.total - 1);
      notify.success(parentId ? "Reply deleted" : "Question deleted");
    } catch (err) {
      notify.error("Can’t delete this", err.message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await api(`/qna/lecture/${lectureId}?page=${data.page + 1}`);
      setData((d) => {
        const seen = new Set(d.questions.map((q) => q.id));
        return { ...res, questions: [...d.questions, ...res.questions.filter((q) => !seen.has(q.id))] };
      });
    } catch (err) {
      notify.error("Couldn’t load more questions", err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  if (failed && !data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted">We couldn’t load the questions.</p>
        <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
          Try again
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div aria-busy="true" aria-label="Loading questions" className="flex animate-pulse flex-col gap-4">
        <div className="h-24 rounded-base bg-surface" />
        <div className="h-16 rounded-base bg-surface" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PostForm
        id={`ask-${lectureId}`}
        label="Ask a question about this lecture"
        placeholder="What are you stuck on? Others in the course and the instructor can answer."
        submitLabel="Post question"
        onSubmit={ask}
      />

      {data.questions.length === 0 ? (
        <p className="text-muted">No questions yet. Be the first to ask.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {data.questions.map((q) => (
            <li key={q.id} className="flex flex-col gap-3 rounded-base bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <Byline post={q} />
                <DeleteButton post={q} label={`Delete the question by ${q.author.name}`} onClick={() => setToDelete({ post: q, parentId: null })} />
              </div>
              <p className="whitespace-pre-line break-words">{q.body}</p>

              {q.replies.length > 0 && (
                <ul aria-label={`Replies to the question by ${q.author.name}`} className="flex flex-col gap-4 border-l-2 border-border pl-4">
                  {q.replies.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <Byline post={r} />
                        <DeleteButton post={r} label={`Delete the reply by ${r.author.name}`} onClick={() => setToDelete({ post: r, parentId: q.id })} />
                      </div>
                      <p className="whitespace-pre-line break-words">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {replyingTo === q.id ? (
                <PostForm
                  id={`reply-${q.id}`}
                  label="Your reply"
                  placeholder="Write a reply"
                  submitLabel="Post reply"
                  onSubmit={(body) => sendReply(q, body)}
                  onCancel={() => setReplyingTo(null)}
                  autoFocus
                />
              ) : (
                <div>
                  <Button variant="ghost" onClick={() => setReplyingTo(q.id)} aria-label={`Reply to the question by ${q.author.name}`}>
                    Reply{q.replies.length > 0 ? ` (${q.replies.length})` : ""}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.page < data.totalPages && (
        <div>
          <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
            Show more questions
          </Button>
        </div>
      )}

      <Modal
        open={Boolean(toDelete)}
        title={toDelete?.parentId ? "Delete this reply?" : "Delete this question?"}
        onClose={() => !deleting && closeDelete()}
        footer={
          <>
            <Button variant="secondary" onClick={closeDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button loading={deleting} onClick={confirmDelete} leadingIcon="delete-sm" className="bg-danger text-field-ink hover:bg-danger/90">
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body">
          {toDelete?.parentId ? "This reply will be removed." : "The question and all of its replies will be removed."} This can’t be undone.
        </p>
      </Modal>
    </div>
  );
}
