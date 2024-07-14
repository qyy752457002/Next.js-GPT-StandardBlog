import { useRouter } from 'next/router';
import React, { useCallback, useReducer, useState } from 'react';

// 创建一个上下文，用于在整个应用中共享posts相关的数据和操作
const PostsContext = React.createContext({});

export default PostsContext;

// 定义posts的reducer函数，用于处理不同的动作
function postsReducer(state, action) {
  switch (action.type) {

    case 'addPosts': {
      // 处理添加新posts的动作
      const newPosts = [...state];
      action.posts.forEach((post) => {
        // 检查新post是否已经存在，避免重复添加
        const exists = newPosts.find((p) => p._id === post._id);
        if (!exists) {
          newPosts.push(post);
        }
      });
      return newPosts;
    }
    
    case 'deletePost': {
      // 处理删除post的动作
      const newPosts = [];
      state.forEach((post) => {
        if (post._id !== action.postId) {
          newPosts.push(post);
        }
      });
      return newPosts;
    }
    default:
      return state;
  }
}

// 定义PostsProvider组件，用于提供posts相关的上下文数据
export const PostsProvider = ({ children }) => {
  // 使用useReducer来管理posts状态
  const [posts, dispatch] = useReducer(postsReducer, []);
  // 使用useState来管理是否没有更多posts的状态
  const [noMorePosts, setNoMorePosts] = useState(false);

  // 定义deletePost回调，用于删除指定的post
  const deletePost = useCallback((postId) => {
    dispatch({
      type: 'deletePost',
      postId,
    });
  }, []);

  // 定义setPostsFromSSR回调，用于设置从服务器端渲染获取的posts
  const setPostsFromSSR = useCallback((postsFromSSR = []) => {
    dispatch({
      type: 'addPosts',
      posts: postsFromSSR,
    });
  }, []);

  // 定义getPosts回调，用于从服务器获取posts
  const getPosts = useCallback(
    async ({ lastPostDate, getNewerPosts = false }) => {
      const result = await fetch(`/api/getPosts`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ lastPostDate, getNewerPosts }),
      });
      const json = await result.json();
      const postsResult = json.posts || [];
      if (postsResult.length < 5) {
        setNoMorePosts(true); // 如果获取的posts少于5个，设置没有更多posts
      }
      dispatch({
        type: 'addPosts',
        posts: postsResult,
      });
    },
    []
  );

  // 返回上下文提供器组件，提供posts相关的数据和操作
  return (
    <PostsContext.Provider
      value={{ posts, setPostsFromSSR, getPosts, noMorePosts, deletePost }}
    >
      {children}
    </PostsContext.Provider>
  );
};
