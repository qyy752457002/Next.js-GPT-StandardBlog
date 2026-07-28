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
  // 点过 Load more 后为 true；整页刷新时 Provider 重建会重置
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
    setHasLoadedAll(true);
  }, []);

  const setPostsFromSSR = useCallback(
    (postsFromSSR = [], hasMorePosts = false) => {
      // 已展开全部：切换帖子时不重置列表、不把 Load more 再显示出来
      if (hasLoadedAll) {
        dispatch({
          type: "addPosts",
          posts: postsFromSSR,
        });
        return;
      }

      dispatch({
        type: "replacePosts",
        posts: postsFromSSR,
      });
      setNoMorePosts(!hasMorePosts);
    },
    [hasLoadedAll]
  );

  const getPosts = useCallback(async ({ lastPostDate } = {}) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
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
        created: post.created ? new Date(post.created).toISOString() : "",
      }));

      dispatch({
        type: "addPosts",
        posts: postsResult,
      });
      setNoMorePosts(true);
      setHasLoadedAll(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  return (
    <PostsContext.Provider
      value={{
        posts,
        setPostsFromSSR,
        getPosts,
        noMorePosts,
        loadingMore,
        deletePost,
        deleteAllPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};
