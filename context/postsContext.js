import React, { useCallback, useReducer, useState } from "react";

const PostsContext = React.createContext({});

export default PostsContext;

function sortByCreatedDesc(posts) {
  return [...posts].sort((a, b) => {
    const timeA = new Date(a.created).getTime() || 0;
    const timeB = new Date(b.created).getTime() || 0;
    return timeB - timeA;
  });
}

function postsReducer(state, action) {
  switch (action.type) {
    case "replacePosts": {
      return sortByCreatedDesc(action.posts || []);
    }
    case "addPosts": {
      const merged = [...state];
      (action.posts || []).forEach((post) => {
        const exists = merged.find((p) => p._id === post._id);
        if (!exists) {
          merged.push(post);
        }
      });
      return sortByCreatedDesc(merged);
    }
    case "deletePost": {
      return state.filter((post) => post._id !== action.postId);
    }
    case "deleteAllPosts": {
      return [];
    }
    default:
      return state;
  }
}

export const PostsProvider = ({ children }) => {
  const [posts, dispatch] = useReducer(postsReducer, []);
  const [noMorePosts, setNoMorePosts] = useState(true);

  const deletePost = useCallback((postId) => {
    dispatch({
      type: "deletePost",
      postId,
    });
  }, []);

  const deleteAllPosts = useCallback(() => {
    dispatch({
      type: "deleteAllPosts",
    });
    setNoMorePosts(true);
  }, []);

  // SSR：始终重置为最新一批（最多 5 条），不与旧状态合并
  const setPostsFromSSR = useCallback((postsFromSSR = [], hasMorePosts = false) => {
    dispatch({
      type: "replacePosts",
      posts: postsFromSSR,
    });
    setNoMorePosts(!hasMorePosts);
  }, []);

  // Load more：拉取剩余全部帖子
  const getPosts = useCallback(async ({ lastPostDate } = {}) => {
    const result = await fetch(`/api/getPosts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ lastPostDate, loadAll: true }),
    });

    const json = await result.json();
    const postsResult = (json.posts || []).map((post) => ({
      ...post,
      _id: post._id?.toString?.() ?? post._id,
      created: post.created
        ? new Date(post.created).toISOString()
        : "",
    }));

    dispatch({
      type: "addPosts",
      posts: postsResult,
    });
    setNoMorePosts(true);
  }, []);

  return (
    <PostsContext.Provider
      value={{
        posts,
        setPostsFromSSR,
        getPosts,
        noMorePosts,
        deletePost,
        deleteAllPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};
