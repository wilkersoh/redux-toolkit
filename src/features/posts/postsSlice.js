import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import { sub } from "date-fns";
import axios from "axios";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const initialState = {
	posts: [],
	status: "idle", // idle || loading, succeeded, failed
	error: null,
};

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

export const postsSlice = createSlice({
	name: "posts",
	initialState,
	reducers: {
		postAdded: {
			reducer(state, action) {
				/**
					why we push value into state in react? normally we don't MUTATE state in this way in reactjs.
					Because of toolkit use immerJs under hook that will automatically creates new state underneath,
					this only work inside createSlice fn
				*/
				state.posts.push(action.payload);
			},
			prepare(title, content, userId) {
				/**
					Clean Code,
					if not we need pass in every postAdded( {	id: nanoid(), title, content } )
				*/
				return {
					payload: {
						id: nanoid(),
						title,
						content,
						date: new Date().toISOString(), // toISOString -> format to timestamp
						userId,
						reactions: {
							thumbsUp: 0,
							wow: 0,
							heart: 0,
							rocket: 0,
							coffee: 0,
						},
					},
				};
			},
		},
		reactionAdded(state, action) {
			const { postId, reaction } = action.payload;
			const existingPost = state.posts.find((post) => post.id === postId);
			if (existingPost) {
				existingPost.reactions[reaction]++;
			}
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
				state.posts = state.posts.concat(loadedPosts);
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
					hooray: 0,
					heart: 0,
					rocket: 0,
					eyes: 0,
				};
				console.log(action.payload);
				state.posts.push(action.payload);
			});
	},
});

/**
  import { selectAllPosts } from "./postsSlice";
	const posts = useSelector(selectAllPosts); -----> use this
	const posts = useSelector((state) => state.posts.posts); ---> dont use this

	如果 以後我們要更改 只需要來到 slice這裡改就好了 不必去到 每一個file 去換
*/
export const selectAllPosts = (state) => state.posts.posts;
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;

export const { postAdded, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
