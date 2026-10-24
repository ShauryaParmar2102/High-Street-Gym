import { useEffect,useState, useCallback } from "react";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/UseAuthenticate";
import { MdDelete, MdAdd } from "react-icons/md";

function BlogView() {
    const { user } = useAuthenticate();
    const [posts, setPosts] = useState([]);
    // Tracks whether blog posts are loading
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    //Create Post State
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const getAuthKey = () => {
        return localStorage.getItem("auth-key");
    };

    //GET POSTS
    const getPosts = useCallback(() => {
    // Start loading blog posts
    setIsLoading(true);

    setPosts([]);
    setStatus(null);

        const authKey = getAuthKey();

        // Send a GET request to retrieve blog posts
        fetchAPI("GET", "/posts", null, authKey)
    .then(async (response) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
                if (response.status === 200) {
                    setPosts(response.body);
                } else {
                    setStatus(
                        response.body?.message ||
                        "Failed to load blog posts"
                    );
                }
            })
            .catch((error) => {
            // Display an error if loading posts fails
            setStatus(String(error));
                })
                .finally(() => {
                    // Stop loading when the request finishes
                    setIsLoading(false);
                });
    }, []);

    //CHECK LOGIN
    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(Boolean(getAuthKey()));
        };

        checkLogin();
        window.addEventListener("focus", checkLogin);

        return () => {
            window.removeEventListener("focus", checkLogin);
        };
    }, []);

    useEffect(() => {
        getPosts();
    }, [getPosts]);

    //ASK FOR DELETE CONFIRMATION
    const askDeletePost = (postId) => {
        const authKey  = getAuthKey();

        if(!authKey) {
            setStatus("Please login to delete posts");
            return;
        }

        setConfirmDelete(postId);
        setStatus(null);
    };

    //DELETE POST
    const confirmDeletePost = useCallback(()=> {
        if(!confirmDelete) return;

        const authKey = getAuthKey();

        if(!authKey) {
            setStatus("Please login to delete Posts")
            setConfirmDelete(null);
            return;
        }

        // Send a DELETE request to remove the selected blog post
        fetchAPI(
            "DELETE",
            `/posts/${confirmDelete}`,
            null,
            authKey
        )
            .then((response) => {

                //Check if post was created successfully
                if (response.status === 200) {
                    setConfirmDelete(null);
                    getPosts(); // Refresh the blog posts
                } else {
                    setStatus(
                        response.body?.message ||
                        "Failed to delete post"
                    );
                    setConfirmDelete(null); // Close the delete confirmation
                }
            })
            .catch((error) => {
                setStatus(String(error));
                setConfirmDelete(null);
            });
    }, [confirmDelete, getPosts]);

    //OPEN CREATE FORM
    const openCreatePost = () => {
        const authkey = getAuthKey();

        if(!authkey) {
            setStatus("Please login to create posts");
            return;
        }

        setStatus(null);
        setTitle("");
        setContent("");
        setShowCreate(true);
    };

    //CREATE POST
    const createPost = async () => {
        const authKey = getAuthKey();

        // Check if the user is logged in
        if(!authKey) {
            setStatus("Please Login to create posts");
            setShowCreate(false);
            return;
        }

        // Check if the title is empty
        if(!title.trim()) {
            setStatus("Please enter a title");
            return;
        }

        // Check if the content is empty
        if(!content.trim()) {
            setStatus("Please enter some content");
            return;
        }

        try {
                // Set the creating state to true while the post is being created
            setIsCreating(true);

            // Clear any previous status messages
            setStatus(null);

             // Send a POST request to create a new blog post
            const response = await fetchAPI(
                "POST",
                "/posts/",
                {
                    post: {
                        title: title.trim(), // Remove extra spaces from the title
                        content: content.trim() // Remove extra spaces from the content
                    }
                },
                   // Send the user's authentication key
                authKey
            );

            if(response.status === 201) {
                setShowCreate(false);
                setTitle("");
                setContent("");
                getPosts();
            } else {
                setStatus(
                    response.body?.message ||
                    "Failed to create post"
                );
            }
        } catch (error) {
            setStatus(String(error));
        } finally {
            setIsCreating(false);
        }
    };

    return (
            <section className="min-h-screen bg-[#f5f5f5] p-4 text-neutral-900">

        {/* Page heading */}
        <div className="mb-6 w-full max-w-4xl rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-neutral-900">
                Gym Blog
            </h1>

            <p className="mt-1 text-sm text-neutral-600">
                Stay updated with the latest gym news and announcements.
            </p>
        </div>
             
             {/* Navigation */}
             <div className="navbar mb-5 w-full max-w-4xl rounded-xl border border-neutral-200 bg-white px-5 shadow-sm">
                <h1 className="text-lg font-bold text-neutral-900">

                    Posts
                </h1>

                <div className="ml-auto">
                    <button
                        type="button"
                        className="btn btn-sm rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
                        onClick={openCreatePost}
                        disabled={!isLoggedIn}
                        >
                            <MdAdd className="text-lg" />
                            New Post
                        </button>
                </div>
             </div>

              {/* Status */}

              {status && (
                <span className="w-full max-w-4xl text-error">
                    {status}
                </span>
              )}

              {/* Show a spinner while loading posts */}
                {isLoading ? (
                    <div className="flex w-full justify-center mt-8">
                        <span className="loading loading-spinner loading-xl"></span>
                    </div>
                ) : posts.length === 0 && !status ? (
                    <p className="text-center opacity-60">
                        No blog posts available yet.
                    </p>
                ) : null}

               {/* Blog post list */}
               <ul className="w-full max-w-4xl space-y-4">
                {posts.map((post) => (
    <li
                        key={post.id}
                        className="rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-md"
                    >
                        {/* Post header */}
                        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
                            <div className="min-w-0">
                                <h2 className="break-words text-lg font-bold text-neutral-900">
                                    {post.title}
                                </h2>

                                {/* Display the name of the user who created the post */}
                                <p className="mt-1 text-sm opacity-70">
                                    Posted by {post.firstName} {post.lastName}
                                </p>

                                <span className="mt-1 block text-xs opacity-50">
                                    {new Date(
                                        post.createdAt
                                    ).toLocaleDateString("en-AU", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            {/* Only show Delete if the logged-in user owns the post */}
                            {user && Number(user.id) === Number(post.userid) && (
                                <button
                                    type="button"
                                    className="btn btn-error btn-sm"
                                    onClick={() => {
                                        askDeletePost(post.id);
                                    }}
                                >
                                    <MdDelete />
                                    Delete
                                </button>
                            )}
                        </div>

                         {/* Post content */}
                         <div className="pt-4">
                            <p className="whitespace-pre-line break-words text-sm leading-7">
                                {post.content}
                            </p>
                         </div>
                    </li>
                ))}
               </ul>

               {/* Create Post Modal */}
               {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-xl">
                        
                        <h3 className="text-2xl font-bold text-center text-neutral-900">

                            Create Blog Post
                        </h3>

                        {/* Title */}
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="text-sm font-medium text-neutral-700">
                                    Title
                                </span>
                            </label>

                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => 
                                    setTitle(e.target.value)                                   
                                }
                                placeholder="Enter Post Title..."
                                className="input w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                                disabled={isCreating}
                                />
                        </div>

                        {/* Content */}
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="text-sm font-medium text-neutral-700">
                                    Content
                                </span>
                            </label>

                            <textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value)
                                }}
                                placeholder="Write your post..."
                                className="textarea h-52 w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                                disabled={isCreating}
                                />
                        </div>

                        {/* Buttons */}
                            <div className="modal-action mt-5 flex justify-end gap-2">
                                
                                <button
                                    type="button"
                                    onClick={()=> {
                                        setShowCreate(false)
                                    }}
                                    className="btn rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                                    disabled={isCreating}
                                    >
                                    Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={createPost}
                                        className="btn rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
                                        disabled={isCreating}
                                        >
                                            {isCreating ? (
                                                 <span className="loading loading-spinner" />
                                            ) : (
                                                "Create Post"
                                            )}
                                        </button>
                                </div>        
                    </div>

                    <div
    className="modal-backdrop"
    onClick={() => {
        if (!isCreating) {
            setShowCreate(false);
        }
    }}
></div>

</div>
)}

{/* Delete Confirmation Modal */}
{confirmDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-xl">

            <h3 className="text-2xl font-bold text-center text-neutral-900">

                Delete Blog Post
            </h3>

            <p className="py-4">
                Are you sure you want to delete this blog post?
                This cannot be undone.
            </p>

            <div className="modal-action flex justify-end gap-2">

                <button
                    type="button"
                    onClick={() => 
                        setConfirmDelete(null)
                    }
                    className="btn rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirmDeletePost}
                        className="btn btn-error"
                        >
                            <MdDelete />
                            Delete
                        </button>
                    </div>
                </div>

                <div
                    className="modal-backdrop"
                    onClick={() =>
                        setConfirmDelete(null)
                    }
                    />
            </div>
        )}

</section>
);
}

export default BlogView;