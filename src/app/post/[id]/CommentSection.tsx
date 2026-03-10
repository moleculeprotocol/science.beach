"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createComment, deleteComment, toggleCommentReaction } from "./actions";
import { formatRelativeTime } from "@/lib/utils";
import AvatarClient from "@/components/AvatarClient";
import TextArea from "@/components/TextArea";
import PixelButton from "@/components/PixelButton";
import Markdown from "@/components/Markdown";
import LikeButton from "@/components/LikeButton";
import { trackCommentLiked } from "@/lib/tracking-client";
import type { CommentReaction } from "@/lib/postDetails";

type CommentWithProfile = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_bg: string | null;
  };
};

type Props = {
  postId: string;
  comments: CommentWithProfile[];
  commentReactions: CommentReaction[];
  currentUserId: string | null;
  isAdmin?: boolean;
};

type TreeNode = CommentWithProfile & { children: TreeNode[] };

function buildTree(comments: CommentWithProfile[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const c of comments) map.set(c.id, { ...c, children: [] });
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function countDescendants(node: TreeNode): number {
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
}

function CommentNode({
  node, postId, currentUserId, depth, isAdmin, defaultCollapsed, commentReactions,
}: {
  node: TreeNode; postId: string; currentUserId: string | null; depth: number; isAdmin?: boolean; defaultCollapsed?: boolean; commentReactions: CommentReaction[];
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? true);
  const [isPending, startTransition] = useTransition();
  const canDelete = currentUserId === node.author_id || isAdmin;
  const replyCount = countDescendants(node);
  const myReactions = commentReactions.filter((r) => r.comment_id === node.id);
  const likeCount = myReactions.filter((r) => r.type === "like").length;
  const hasLiked = myReactions.some((r) => r.author_id === currentUserId && r.type === "like");

  return (
    <div className={depth > 0 ? "ml-2 border-l border-smoke-5 pl-2 sm:ml-4 sm:pl-3" : ""}>
      <div className="flex gap-2 py-2">
        {/* Collapse toggle line */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
          aria-label={collapsed ? "Expand comment" : "Collapse comment"}
        >
          <AvatarClient bg={node.profiles.avatar_bg} size="xs" />
          {!collapsed && node.children.length > 0 && (
            <div className="w-px flex-1 bg-smoke-5 group-hover:bg-blue-4 transition-colors" />
          )}
        </button>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-kode-mono text-[11px] leading-[1.4] text-dark-space font-bold">{node.profiles.display_name}</span>
            <span className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5">{formatRelativeTime(node.created_at)}</span>
            {collapsed && replyCount > 0 && (
              <span className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5">
                [{replyCount} {replyCount === 1 ? "reply" : "replies"}]
              </span>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5 truncate cursor-pointer hover:text-smoke-2 transition-colors text-left"
            >
              {node.body.length > 120 ? node.body.slice(0, 120) + "..." : node.body}
            </button>
          )}

          {!collapsed && (
            <>
              <div className="font-kode-mono text-[13px] leading-[1.5] text-sand-6 **:text-[13px]! **:leading-[1.5]! **:font-[inherit]! **:text-sand-6!">
                <Markdown>{node.body}</Markdown>
              </div>
              <div className="flex items-center gap-3">
                <LikeButton
                  liked={hasLiked}
                  count={likeCount}
                  disabled={isPending || !currentUserId}
                  onClick={() => { trackCommentLiked({ post_id: postId, comment_id: node.id }); startTransition(() => toggleCommentReaction(node.id, postId)); }}
                  size="sm"
                />
                {currentUserId && <ReplyForm postId={postId} parentId={node.id} />}
                {canDelete && (
                  <button onClick={() => deleteComment(node.id, postId)} className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5 hover:text-orange-1 transition-colors">
                    delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5 hover:text-blue-4 transition-colors cursor-pointer"
                >
                  collapse
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {!collapsed && node.children.map((child) => (
        <CommentNode key={child.id} node={child} postId={postId} currentUserId={currentUserId} depth={depth + 1} isAdmin={isAdmin} commentReactions={commentReactions} />
      ))}
    </div>
  );
}

function ReplyForm({ postId, parentId }: { postId: string; parentId: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <details ref={detailsRef} className="group">
      <summary className="font-kode-mono text-[11px] leading-[1.4] text-smoke-5 hover:text-blue-4 transition-colors cursor-pointer">reply</summary>
      <form
        ref={formRef}
        action={async (formData) => {
          setError(null);
          const result = await createComment(formData);
          if (result?.error) {
            toast.error(result.error);
            setError(result.error);
            return;
          }
          toast.success("Reply posted!");
          formRef.current?.reset();
          if (detailsRef.current) detailsRef.current.open = false;
        }}
        className="flex flex-col gap-2 mt-2"
      >
        <input type="hidden" name="post_id" value={postId} />
        {parentId && <input type="hidden" name="parent_id" value={parentId} />}
        <TextArea compact name="body" required rows={2} maxLength={5000} placeholder="Write a reply..." />
        {error && <p className="label-s-regular text-orange-1">{error}</p>}
        <PixelButton type="submit" bg="blue-4" textColor="light-space" shadowColor="blue-2" textShadowTop="blue-2" textShadowBottom="blue-5" className="self-start">
          Reply
        </PixelButton>
      </form>
    </details>
  );
}

export default function CommentSection({ postId, comments, commentReactions, currentUserId, isAdmin }: Props) {
  const tree = buildTree(comments);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col">
        {tree.map((node) => (
          <CommentNode key={node.id} node={node} postId={postId} currentUserId={currentUserId} depth={0} isAdmin={isAdmin} commentReactions={commentReactions} />
        ))}
      </div>

      {currentUserId ? (
        <form
          ref={formRef}
          action={async (formData) => {
            setError(null);
            setSubmitting(true);
            const result = await createComment(formData);
            setSubmitting(false);
            if (result?.error) {
              toast.error(result.error);
              setError(result.error);
              return;
            }
            toast.success("Comment posted!");
            formRef.current?.reset();
          }}
          className="flex flex-col gap-2 border-2 border-sand-3 bg-sand-1 rounded-[2px] p-3"
        >
          <input type="hidden" name="post_id" value={postId} />
          <TextArea compact name="body" required rows={3} maxLength={5000} placeholder="Add a comment..." className="bg-smoke-7 border-sand-4!" />
          {error && <p className="label-s-regular text-orange-1">{error}</p>}
          <div className="flex justify-end">
            <PixelButton type="submit" disabled={submitting} bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5">
              {submitting ? "Commenting..." : "Comment"}
            </PixelButton>
          </div>
        </form>
      ) : (
        <p className="paragraph-s text-smoke-5">Sign in to comment.</p>
      )}
    </section>
  );
}
