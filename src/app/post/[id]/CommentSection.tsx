"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createComment, deleteComment } from "./actions";
import { formatRelativeTime } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import TextArea from "@/components/TextArea";
import PixelButton from "@/components/PixelButton";
import Markdown from "@/components/Markdown";

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

function CommentNode({
  node, postId, currentUserId, depth, isAdmin,
}: {
  node: TreeNode; postId: string; currentUserId: string | null; depth: number; isAdmin?: boolean;
}) {
  const canDelete = currentUserId === node.author_id || isAdmin;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-smoke-5 pl-3" : ""}>
      <div className="flex flex-col gap-1.5 py-2">
        <div className="flex items-center gap-2">
          <Avatar bg={node.profiles.avatar_bg} size="sm" />
          <span className="label-s-bold text-dark-space">{node.profiles.display_name}</span>
          <span className="label-s-regular text-smoke-5">{formatRelativeTime(node.created_at)}</span>
        </div>
        <div className="paragraph-s text-smoke-2">
          <Markdown>{node.body}</Markdown>
        </div>
        <div className="flex items-center gap-3">
          {currentUserId && <ReplyForm postId={postId} parentId={node.id} />}
          {canDelete && (
            <button onClick={() => deleteComment(node.id, postId)} className="label-s-regular text-smoke-5 hover:text-orange-1 transition-colors">
              delete
            </button>
          )}
        </div>
      </div>
      {node.children.map((child) => (
        <CommentNode key={child.id} node={child} postId={postId} currentUserId={currentUserId} depth={depth + 1} isAdmin={isAdmin} />
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
      <summary className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors cursor-pointer">reply</summary>
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

export default function CommentSection({ postId, comments, currentUserId, isAdmin }: Props) {
  const tree = buildTree(comments);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-2">
      <h6 className="h7 text-dark-space">Comments ({comments.length})</h6>

      {currentUserId ? (
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
            toast.success("Comment posted!");
            formRef.current?.reset();
          }}
          className="flex flex-col gap-2 border border-smoke-5 bg-smoke-6 p-3"
        >
          <input type="hidden" name="post_id" value={postId} />
          <TextArea compact name="body" required rows={3} maxLength={5000} placeholder="Add a comment..." className="bg-smoke-7" />
          {error && <p className="label-s-regular text-orange-1">{error}</p>}
          <PixelButton type="submit" bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5" className="self-start">
            Comment
          </PixelButton>
        </form>
      ) : (
        <p className="paragraph-s text-smoke-5">Sign in to comment.</p>
      )}

      <div className="flex flex-col">
        {tree.map((node) => (
          <CommentNode key={node.id} node={node} postId={postId} currentUserId={currentUserId} depth={0} isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  );
}
