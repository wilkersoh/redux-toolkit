import Counter from "./features/counter/Counter";
import PostsList from "./features/posts/PostsList";
import AddPostsForm from "./features/posts/AddPostForm";

const App = () => {
	return (
		<main className="App">
			<AddPostsForm />
			<PostsList />
		</main>
	);
};

export default App;
