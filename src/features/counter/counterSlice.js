import { createSlice } from "@reduxjs/toolkit";

/**
  1. Create Slice
  2. export reducers's object fn from counterSlice.actions
  3. export default counterSlice.reducer for store.js
  4. register your slice into global store
  5. you can use reducers's object fn from other files.
    a. useSelector from react-redux to access the global store and the value
    a. useDispatch from react-redux to trigger the actions into the store
*/

const initialState = {
	count: 0,
};

export const counterSlice = createSlice({
	name: "counter",
	initialState,
	reducers: {
		increment: (state) => {
			state.count += 1;
		},
		decrement: (state) => {
			state.count -= 1;
		},
		reset: (state) => {
			state.count = 0;
		},
		incrementByAmount: (state, action) => {
			state.count += action.payload;
		},
	},
});

export const { increment, decrement, reset, incrementByAmount } =
	counterSlice.actions;

export default counterSlice.reducer;
