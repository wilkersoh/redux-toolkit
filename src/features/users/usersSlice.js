import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

const initialState = [];

/**
 * @exmaple createAsyncThunk('placeholderApiName')
 */
export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
	const response = await axios.get(USERS_URL);
	return response.data;
});

export const usersSlice = createSlice({
	name: "users",
	initialState,
	reducers: {},
	extraReducers(builder) {
		builder.addCase(fetchUsers.fulfilled, (state, action) => {
			return action.payload;
		});
	},
});

export const selectAllUsers = (state) => state.users;

export const {} = usersSlice.actions;

export default usersSlice.reducer;
