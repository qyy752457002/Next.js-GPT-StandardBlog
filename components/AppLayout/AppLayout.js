import { useUser } from "@auth0/nextjs-auth0/client";
import {
  faChevronDown,
  faCoins,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import PostsContext from "../../context/postsContext";
import { Logo } from "../Logo";

export const AppLayout = ({
  children,
  availableTokens,
  posts: postsFromSSR,
  postId,
  hasMorePosts = false,
}) => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [deletingAll, setDeletingAll] = useState(false);

  const { setPostsFromSSR, posts, getPosts, noMorePosts, deleteAllPosts } =
    useContext(PostsContext);

  useEffect(() => {
    setPostsFromSSR(postsFromSSR || [], hasMorePosts);
  }, [postsFromSSR, hasMorePosts, setPostsFromSSR]);

  const handleDeleteAll = async () => {
    if (!posts.length || deletingAll) return;
    const confirmed = window.confirm(
      "Delete all posts? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingAll(true);
      const response = await fetch("/api/deleteAllPosts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });
      const json = await response.json();
      if (json.success) {
        deleteAllPosts();
        router.replace("/post/new");
      } else {
        alert(json.message || "Failed to delete all posts");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete all posts");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen max-h-screen">
      <aside className="flex flex-col text-white overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-cyan-900">
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <Logo />

          <div className="mt-4 space-y-2.5">
            <Link
              href="/post/new"
              className="btn flex items-center justify-center gap-2 hover:no-underline shadow-lg shadow-green-900/30"
            >
              <FontAwesomeIcon icon={faPlus} />
              New post
            </Link>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={!posts.length || deletingAll}
              className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-red-400/40 text-red-200 bg-red-500/10 hover:bg-red-500/25 hover:border-red-300/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/10"
            >
              <FontAwesomeIcon icon={faTrashCan} />
              {deletingAll ? "Deleting..." : "Delete All"}
            </button>

            <Link
              href="/token-topup"
              className="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2.5 transition-colors hover:no-underline group"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                <FontAwesomeIcon icon={faCoins} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-slate-400 group-hover:text-slate-300">
                  Balance
                </span>
                <span className="block text-sm font-semibold text-white truncate">
                  {availableTokens} tokens available
                </span>
              </span>
            </Link>
          </div>
        </div>

        <div className="px-3 py-4 flex-1 overflow-auto">
          <div className="px-2 mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Your posts
          </div>

          {posts.length === 0 ? (
            <div className="mx-1 rounded-lg border border-dashed border-white/15 px-3 py-6 text-center text-sm text-slate-400">
              No posts yet. Create your first one.
            </div>
          ) : (
            <div className="space-y-1">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/post/${post._id}`}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:no-underline text-ellipsis overflow-hidden whitespace-nowrap ${
                    postId === post._id
                      ? "bg-white/20 text-white border border-white/30 shadow-sm"
                      : "bg-white/5 text-slate-200 border border-transparent hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {post.topic}
                </Link>
              ))}
            </div>
          )}

          {!noMorePosts && posts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                getPosts({ lastPostDate: posts[posts.length - 1].created });
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border border-cyan-400/40 text-cyan-100 bg-cyan-500/10 hover:bg-cyan-500/25 hover:border-cyan-300/60 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
              Load more posts
            </button>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/20 px-4 py-3 min-h-[66px] flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-3 w-full animate-pulse">
              <div className="h-[42px] w-[42px] rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 w-full">
              <div className="relative shrink-0">
                <Image
                  src={user.picture}
                  alt={user.name || "User"}
                  height={42}
                  width={42}
                  className="rounded-full ring-2 ring-white/20"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold text-white truncate"
                  title={user.email}
                >
                  {user.email}
                </div>
                <Link
                  className="text-xs text-cyan-200/80 hover:text-white transition-colors"
                  href="/api/auth/logout"
                >
                  Logout
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/api/auth/login"
              className="btn hover:no-underline text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </aside>
      {children}
    </div>
  );
};
