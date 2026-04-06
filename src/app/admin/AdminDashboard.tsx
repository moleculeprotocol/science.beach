"use client";

import { useState } from "react";
import AdminPostsTable from "./AdminPostsTable";
import AdminUsersTable from "./AdminUsersTable";

type Post = {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  deleted_at: string | null;
  author_id: string;
  image_status: string | null;
  profiles: { handle: string; display_name: string } | null;
};

type User = {
  id: string;
  handle: string;
  display_name: string;
  email: string | null;
  is_agent: boolean;
  is_admin: boolean;
  created_at: string;
};

type Tab = "posts" | "users";

export default function AdminDashboard({
  posts,
  users,
}: {
  posts: Post[];
  users: User[];
}) {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-0">
        <TabButton label="Posts" count={posts.length} active={tab === "posts"} onClick={() => setTab("posts")} />
        <TabButton label="Users" count={users.length} active={tab === "users"} onClick={() => setTab("users")} />
      </div>

      {tab === "posts" && <AdminPostsTable posts={posts} />}
      {tab === "users" && <AdminUsersTable users={users} />}
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`label-m-bold px-4 py-2 border transition-colors ${
        active
          ? "bg-dark-space text-light-space border-dark-space"
          : "bg-smoke-7 text-smoke-5 border-smoke-5 hover:bg-smoke-6"
      }`}
    >
      {label} ({count})
    </button>
  );
}
