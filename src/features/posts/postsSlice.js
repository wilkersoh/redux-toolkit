import { createSlice, nanoid } from "@reduxjs/toolkit";
import { sub } from "date-fns";

const initialState = [
	{
		id: "1",
		title: "Learning Redux Toolkit",
		content: "I've heard good things.",
		date: sub(new Date(), { minutes: 10 }).toISOString(), // 10min before
		reactions: {
			thumbsUp: 0,
			wow: 0,
			heart: 0,
			rocket: 0,
			coffee: 0,
		},
	},
	{
		id: "2",
		title: "Slices...",
		content: "The more I say slice, the more I want pizza.",
		date: sub(new Date(), { minutes: 5 }).toISOString(),
		reactions: {
			thumbsUp: 0,
			wow: 0,
			heart: 0,
			rocket: 0,
			coffee: 0,
		},
	},
];

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
				state.push(action.payload);
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
			const existingPost = state.find((post) => post.id === postId);
			if (existingPost) {
				existingPost.reactions[reaction]++;
			}
		},
	},
});

/**
  import { selectAllPosts } from "./postsSlice";
	const posts = useSelector(selectAllPosts); -----> use this
	const posts = useSelector((state) => state.posts); ---> dont use this

	如果 以後我們要更改 只需要來到 slice這裡改就好了 不必去到 每一個file 去換
*/
export const selectAllPosts = (state) => state.posts;

export const { postAdded, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
