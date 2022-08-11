import {
	createSlice,
	createAsyncThunk,
	createSelector,
	createEntityAdapter,
} from "@reduxjs/toolkit";
import { sub } from "date-fns";
import axios from "axios";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

/**
	createEntityAdapter will perform normalizatin
	it will create and return a state shape from createEntityAdapter
	1.
	{
		posts: {
			ids: [1, 2, 3, ...]
			entities: {
				'1': {
					userId: 1,
					id: 1,
					title: ...etc
				}
			}
		}
	}
	2.
	getInitialState, init the state into the adapter
	3.
	update into Slice's initialState
	4. exmaple to get the post from the id
	previous -> const existingPost = state.post.find(post => post.id === postId)
	now -> const existingPost = state.entities[postId];
	because it is Map after normalization
*/
const postsAdapter = createEntityAdapter({
	sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState({
	status: "idle", //'idle' | 'loading' | 'succeeded' | 'failed'
	error: null,
	count: 0,
});

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
	const response = await axios.get(POSTS_URL);
	return [...response.data];
});

export const addNewPost = createAsyncThunk(
	"posts/addNewPost",
	async (initialPost) => {
		const response = await axios.post(POSTS_URL, initialPost);
		return response.data;
	}
);

export const updatePost = createAsyncThunk(
	"posts/updatePost",
	async (initialPost) => {
		const { id } = initialPost;
		try {
			const response = await axios.put(`${POSTS_URL}/${id}`, initialPost);
			return response.data;
		} catch (err) {
			return err.message;
			// return initialPost; // only for testing Redux!
		}
	}
);
export const deletePost = createAsyncThunk(
	"posts/deletePost",
	async (initialPost) => {
		const { id } = initialPost;
		try {
			const response = await axios.delete(`${POSTS_URL}/${id}`, initialPost);
			if (response?.status === 200) return initialPost;
			return `${response?.status}: ${response?.statusText}`;
		} catch (err) {
			return err.message;
			// return initialPost; // only for testing Redux!
		}
	}
);

export const postsSlice = createSlice({
	name: "posts",
	initialState,
	reducers: {
		// postAdded: {
		// 	reducer(state, action) {
		// 		/**
		// 			why we push value into state in react? normally we don't MUTATE state in this way in reactjs.
		// 			Because of toolkit use immerJs under hook that will automatically creates new state underneath,
		// 			this only work inside createSlice fn
		// 		*/
		// 		state.posts.push(action.payload);
		// 	},
		// 	prepare(title, content, userId) {
		// 		/**
		// 			Clean Code,
		// 			if not we need pass in every postAdded( {	id: nanoid(), title, content } )
		//      now use it > dispatch(postAdded(title, content, userId));
		// 		*/
		// 		return {
		// 			payload: {
		// 				id: nanoid(),
		// 				title,
		// 				content,
		// 				date: new Date().toISOString(), // toISOString -> format to timestamp
		// 				userId,
		// 				reactions: {
		// 					thumbsUp: 0,
		// 					wow: 0,
		// 					heart: 0,
		// 					rocket: 0,
		// 					coffee: 0,
		// 				},
		// 			},
		// 		};
		// 	},
		// },
		reactionAdded(state, action) {
			const { postId, reaction } = action.payload;

			const existingPost = state.entities[postId];
			if (existingPost) {
				existingPost.reactions[reaction]++;
			}
		},
		increaseCount(state, action) {
			state.count = state.count + 1;
		},
	},
	extraReducers(builder) {
		/**
		 * extraReducers which use in redux thunk for the api call
		 * extraReducers let us defined additional case reducers that run in response to the actions defined outside of the slice
		 */
		builder
			.addCase(fetchPosts.pending, (state, action) => {
				state.status = "loading";
			})
			.addCase(fetchPosts.fulfilled, (state, action) => {
				state.status = "succeeded";
				// Adding date and reactions
				let min = 1;
				const loadedPosts = action.payload.map((post) => {
					post.date = sub(new Date(), { minutes: min++ }).toISOString();
					post.reactions = {
						thumbsUp: 0,
						wow: 0,
						heart: 0,
						rocket: 0,
						coffee: 0,
					};
					return post;
				});

				// Add any fetched posts to the array
				// state.posts = state.posts.concat(loadedPosts);
				postsAdapter.upsertMany(state, loadedPosts);
			})
			.addCase(fetchPosts.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.error.message;
			})
			.addCase(addNewPost.fulfilled, (state, action) => {
				action.payload.userId = Number(action.payload.userId);
				action.payload.date = new Date().toISOString();
				action.payload.reactions = {
					thumbsUp: 0,
					wow: 0,
					heart: 0,
					rocket: 0,
					coffee: 0,
				};
				console.log(action.payload);
				// state.posts.push(action.payload);
				postsAdapter.addOne(state, action.payload);
			})
			.addCase(updatePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log("Update could not complete");
					console.log(action.payload);
					return;
				}
				// const { id } = action.payload;
				action.payload.date = new Date().toISOString();
				// const posts = state.posts.filter((post) => post.id !== id);
				// state.posts = [...posts, action.payload];
				postsAdapter.upsertOne(state, action.payload);
			})
			.addCase(deletePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log("Delete could not complete");
					console.log(action.payload);
					return;
				}
				const { id } = action.payload;
				// const posts = state.posts.filter((post) => post.id !== id);
				// state.posts = posts;
				postsAdapter.removeOne(state, id);
			});
	},
});

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
} = postsAdapter.getSelectors((state) => state.posts);

export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;
export const getCount = (state) => state.posts.count;

// export const selectPostById = (state, postId) =>
// 	state.posts.posts.find((post) => post.id === postId);

/**
	createSelector(
		[ getValueFromStore, getValueFromStore ],
		( returnFirstValueFromStore, returnSecondValueFromStore )  => return logics you want to
	)
	why we did in this way that will memorise selector to avoid re-render if the value is not updated

	As Exmaple:

	//users/UserPage.js
	below code will be re-render once we update header count which not any related about the state inside the page

	useSelector will be run when every action is dispatched -> we dispatched the count in the header -> force userPage to re-render also because the return allPosts.filter consider a new value ( not Primitive )

	const postsForUser = useSelector((state) => {
		const allPosts = selectAllPosts(state);
		return allPosts.filter((post) => post.userId === Number(userId));
	});
*/
export const selectPostsByUser = createSelector(
	// @userId passing from UserPage.js
	[selectAllPosts, (state, userId) => userId],
	(posts, userId) => posts.filter((post) => post.userId === userId)
);

export const { increaseCount, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
