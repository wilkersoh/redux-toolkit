import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { sub } from "date-fns";
import { apiSlice } from "../api/apiSlice";

const postsAdapter = createEntityAdapter({
	sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPosts: builder.query({
			query: () => "/posts",
			transformResponse: (responseData) => {
				let min = 1;
				const loadedPosts = responseData.map((post) => {
					if (!post?.date)
						post.date = sub(new Date(), { minutes: min++ }).toISOString();
					if (!post?.reactions)
						post.reactions = {
							thumbsUp: 0,
							wow: 0,
							heart: 0,
							rocket: 0,
							coffee: 0,
						};
					return post;
				});
				return postsAdapter.setAll(initialState, loadedPosts);
			},
			providesTags: (result, error, arg) => [
				{ type: "Post", id: "LIST" },
				...result.ids.map((id) => ({ type: "Post", id })),
			],
		}),
		getPostsByUserId: builder.query({
			query: (id) => `/posts/?userId=${id}`,
			transformResponse: (responseData) => {
				let min = 1;
				const loadedPosts = responseData.map((post) => {
					if (!post?.date)
						post.date = sub(new Date(), { minutes: min++ }).toISOString();
					if (!post?.reactions)
						post.reactions = {
							thumbsUp: 0,
							wow: 0,
							heart: 0,
							rocket: 0,
							coffee: 0,
						};
					return post;
				});
				return postsAdapter.setAll(initialState, loadedPosts);
			},
			providesTags: (result, error, arg) => [
				...result.ids.map((id) => ({ type: "Post", id })),
			],
		}),
		addNewPost: builder.mutation({
			query: (initialPost) => ({
				url: "/posts",
				method: "POST",
				body: {
					...initialPost,
					userId: Number(initialPost.userId),
					date: new Date().toISOString(),
					reactions: {
						thumbsUp: 0,
						wow: 0,
						heart: 0,
						rocket: 0,
						coffee: 0,
					},
				},
			}),
			invalidatesTags: [{ type: "Post", id: "LIST" }],
		}),
		updatePost: builder.mutation({
			query: (initialPost) => ({
				url: `/posts/${initialPost.id}`,
				method: "PUT",
				body: {
					...initialPost,
					date: new Date().toISOString(),
				},
			}),
			invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
		}),
		deletePost: builder.mutation({
			query: ({ id }) => ({
				url: `/posts/${id}`,
				method: "DELETE",
				body: { id },
			}),
			invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
		}),
		addReaction: builder.mutation({
			query: ({ postId, reactions }) => ({
				url: `posts/${postId}`,
				method: "PATCH",
				// In a real app, we'd probably need to base this on user ID somehow
				// so that a user can't do the same reaction more than once
				body: { reactions },
			}),
			async onQueryStarted(
				{ postId, reactions },
				{ dispatch, queryFulfilled }
			) {
				// `updateQueryData` requires the endpoint name and cache key arguments,
				// so it knows which piece of cache state to update
				/**
					this function is updating our cache, it will be update before the api response return
				 */
				const patchResult = dispatch(
					extendedApiSlice.util.updateQueryData(
						"getPosts",
						undefined,
						(draft) => {
							// The `draft` is Immer-wrapped and can be "mutated" like in createSlice
							const post = draft.entities[postId];
							if (post) post.reactions = reactions;
						}
					)
				);
				try {
					await queryFulfilled;
				} catch {
					/**
						if api failed it will undo our cache update
					*/
					patchResult.undo();
				}
			},
		}),
	}),
});

export const {
	useGetPostsQuery,
	useGetPostsByUserIdQuery,
	useAddNewPostMutation,
	useUpdatePostMutation,
	useDeletePostMutation,
	useAddReactionMutation,
} = extendedApiSlice;

// returns the query result object
export const selectPostsResult = extendedApiSlice.endpoints.getPosts.select();

// Creates memoized selector
const selectPostsData = createSelector(
	selectPostsResult,
	(postsResult) => postsResult.data // normalized state object with ids & entities
);

/**
  import { selectAllPosts } from "./postsSlice";
	const posts = useSelector(selectAllPosts); -----> use this
	const posts = useSelector((state) => state.posts.posts); ---> dont use this

	如果 以後我們要更改 只需要來到 slice這裡改就好了 不必去到 每一個file 去換
*/
// export const selectAllPosts = (state) => state.posts.posts;

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
	selectAll: selectAllPosts,
	selectById: selectPostById,
	selectIds: selectPostIds,
	// Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors(
	(state) => selectPostsData(state) ?? initialState
);
