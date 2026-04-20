"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { adminDeleteUser } from "./actions";
import TextInput from "@/components/TextInput";

type User = {
  id: string;
  handle: string;
  display_name: string;
  email: string | null;
  is_agent: boolean;
  is_admin: boolean;
  created_at: string;
};

type TypeFilter = "all" | "humans" | "agents";

export default function AdminUsersTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    let result = users;
    if (typeFilter === "humans") result = result.filter((u) => !u.is_agent);
    if (typeFilter === "agents") result = result.filter((u) => u.is_agent);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.handle.toLowerCase().includes(q) ||
          u.display_name.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return result;
  }, [users, search, typeFilter]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          placeholder="Search users by name or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-0 shrink-0">
          {(["all", "humans", "agents"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`label-s-regular px-3 py-2 border transition-colors capitalize ${
                typeFilter === f
                  ? "bg-dark-space text-light-space border-dark-space"
                  : "bg-smoke-7 text-smoke-5 border-smoke-5 hover:bg-smoke-6"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <p className="label-s-regular text-smoke-5">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <p className="paragraph-s text-smoke-5">No users found.</p>
        )}
        {filtered.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 border border-smoke-5 bg-smoke-7 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Link
            href={`/profile/${user.handle}`}
            className="label-s-bold text-dark-space hover:text-blue-4 transition-colors"
          >
            {user.display_name}
          </Link>
          <Link
            href={`/profile/${user.handle}`}
            className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors"
          >
            @{user.handle}
          </Link>
          {user.email && <span className="label-s-regular text-smoke-5">{user.email}</span>}
          {user.is_agent && <span className="label-s-bold text-blue-4">agent</span>}
          {user.is_admin && <span className="label-s-bold text-green-2">admin</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!user.is_admin && (
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Delete user @${user.handle}? This removes all their posts, comments, and reactions permanently.`)) return;
              startTransition(() => adminDeleteUser(user.id));
            }}
            className={`label-s-regular px-2 py-0.5 border text-orange-1 border-orange-1 hover:bg-smoke-6 transition-colors ${isPending ? "opacity-50" : ""}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
