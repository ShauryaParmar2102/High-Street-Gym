import express from "express";
import { PostModel } from "../models/PostModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

export class PostController {
    static routes = express.Router(); // Creates a router for all post-related routes.

    static {
        
        this.routes.get("/public", this.viewPublicBlog); // Public blog page that anyone can access


        // Displays all posts for administrators
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator"]), // Only administrators can access this page.
            this.viewPosts, // Calls the method that displays all posts.
        );

        // Administrator create, update and delete actions
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator"]),
            this.handlePostsManagement,
        );

                // Displays the logged-in member's posts
        this.routes.get(
            "/member",
            AuthenticationController.restrict(["member"]), // Restricts access to members only.
            this.viewMemberPosts,
        );

        // Route to display the page where members can create a new post
        this.routes.get(
            "/member/create",
            AuthenticationController.restrict(["member"]), // Only allow logged-in users with the member role to access this page
            this.viewCreateMemberPostPage, // Run the controller method that displays the create-post page
        );

        // Handles member actions for creating, updating and deleting posts
        this.routes.post(
            "/member",

                // Only logged-in members can perform these post actions
            AuthenticationController.restrict(["member"]),

                // Process the member's create, update or delete request
            this.handleMemberPost,
        );

        // Route to display the trainer's posts page
        this.routes.get(
            "/trainer",

                // Only logged-in trainers can access this page
            AuthenticationController.restrict(["trainer"]), 

                // Display the trainer posts page
            this.viewTrainerPosts,
        );

            // Route to display the page where trainers can create a new post
        this.routes.get(
            "/trainer/create",

                // Only logged-in trainers can access the create-post page
            AuthenticationController.restrict(["trainer"]),
            
                // Display the trainer create-post page
            this.viewCreateTrainerPostPage,
        );

                // Handles trainer create, update and delete requests
        this.routes.post(
            "/trainer",
            AuthenticationController.restrict(["trainer"]),
            this.handleTrainerPost,
        );

        // Display a specific post by its ID (Accessible by administrators, trainers, and members)
        this.routes.get(
            "/:id",
            AuthenticationController.restrict([
                "administrator",
                "trainer",
                "member",
            ]),
            this.viewPostById, // Calls the controller method to retrieve and display the post
        );
    }

    // Check whether input contains HTML tags
    static containsDangerousHTML(text = "") {
        return /<[^>]*>/i.test(text);
    }

    // Validate a post title and content
    static validatePost(title, content) {
        const cleanTitle = title?.trim();
        const cleanContent = content?.trim();

        let error = null;

        if (!cleanTitle) {
            error = "Post title is required";
        } else if (this.containsDangerousHTML(cleanTitle)) {
            error = "HTML or scripts are not allowed in the title";
        } else if (!/^[A-Z]/.test(cleanTitle)) {
            error = "Post title must start with an uppercase letter";
        } else if (cleanTitle.length < 2) {
            error = "Post title is too short";
        } else if (cleanTitle.length > 50) {
            error = "Post title must not exceed 50 characters";
        } else if (!cleanContent) {
            error = "Post content is required";
        } else if (this.containsDangerousHTML(cleanContent)) {
            error = "HTML or scripts are not allowed in the content";
        } else if (cleanContent.length < 5) {
            error = "Post content must contain at least 5 characters";
        } else if (cleanContent.length > 2000) {
            error = "Post content must not exceed 2000 characters";
        }

        return {
            cleanTitle,
            cleanContent,
            error,
        };
    }

    // Display all posts on the public blog
    static async viewPublicBlog(req, res) {
        try {
            const posts = await PostModel.getAll();

            return res.render("blog_post.ejs", {
                posts,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Failed to load public blog",
                message: "An error occurred while loading the public blog",
            });
        }
    }

    // Display all posts for administrator management
    static async viewPosts(req, res) {
        try {
            let posts = await PostModel.getAll();
            const search = req.query.search || "";

            if (search.trim()) {
                const keyword = search.trim().toLowerCase();

                posts = posts.filter(
                    (post) =>
                        (post.title || "")
                            .toLowerCase()
                            .includes(keyword) ||
                        (post.content || "")
                            .toLowerCase()
                            .includes(keyword),
                );
            }

            const selectedId = Number(req.params.id);

            const selectedPost = Number.isNaN(selectedId)
                ? null
                : await PostModel.getById(selectedId);

            return res.render("post_management.ejs", {
                authenticatedUser: req.user,
                posts,
                selectedPost,
                search,
                error: null,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Failed to load posts",
                message: "An error occurred while loading the posts",
            });
        }
    }

    // Display one post by ID
    static async viewPostById(req, res) {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid post ID",
                    message: "The supplied post ID is invalid",
                });
            }

            const posts = await PostModel.getAll();
            const selectedPost = await PostModel.getById(id);

            if (!selectedPost) {
                return res.status(404).render("status.ejs", {
                    status: "Post not found",
                    message: "The requested post could not be found",
                });
            }

            return res.render("post_management.ejs", {
                authenticatedUser: req.user,
                posts,
                selectedPost,
                search: "",
                error: null,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Failed to load post",
                message: "An error occurred while loading the post",
            });
        }
    }

    // Display posts belonging to the logged-in member
    static async viewMemberPosts(req, res) {
        try {
           const posts = await PostModel.getAll();

        // Show all community posts to the logged-in member
        return res.render("member_post.ejs", { // Render the member posts page and send data to the EJS view
            authenticatedUser: req.user, // Send the currently logged-in user to the EJS page
            posts: posts, //Send all community posts to the EJS pafe
            error: null, //No error occured when loading the posts
        });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Failed to load member posts",
                message: "An error occurred while loading the member posts",
            });
        }
    }

    // Display the member create-post page
    static viewCreateMemberPostPage(req, res) {
        return res.render("member_create_post.ejs", {
            authenticatedUser: req.user,
            error: null,
        });
    }

    // Handle member create, update and delete actions
    static async handleMemberPost(req, res) {
        try {
            const user = req.user;
            const { action, id, title, content } = req.body;

    // ==================== MEMBER CAN DELETE OWN POST ====================

            // Delete only needs the post ID
            if (action === "delete") {
                const existingPost = await PostModel.getById(id);

                // Check if the post belongs to the currently logged-in user
                if (!existingPost) {

                    // Deny access if the user tries to delete another user's post
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                if (existingPost.userid !== user.id) {
                    return res.status(403).render("status.ejs", {
                        status: "Access denied",
                        message: "You can only delete your own posts",
                    });
                }

                await PostModel.delete(id); // Delete the post if it belongs to the logged-in user

                return res.redirect("/post/member"); // Redirect the member back to the posts page after deleting
            }
                // Validate and clean the post title and content before saving it
            const { cleanTitle, cleanContent, error } =

            // Check that the post title and content meet the validation requirements
                    PostController.validatePost(title, content); 

            if (error) {
                const posts = await PostModel.getAll();

                const memberPosts = posts.filter(
                    (post) => post.userid === user.id,
                );
                    // Show the member posts page with the logged-in user and their posts
                return res.status(400).render("member_post.ejs", {
                    authenticatedUser: user,
                    posts: memberPosts,
                    error,
                });
            }

            if (action === "create") {
                const post = new PostModel(
                    null,
                    user.id,
                    cleanTitle,
                    null,
                    cleanContent,
                );

                await PostModel.create(post);

                return res.redirect("/post/member");
            }

            if (action === "update") {
                const existingPost = await PostModel.getById(id);

                if (!existingPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                if (existingPost.userid !== user.id) {
                    return res.status(403).render("status.ejs", {
                        status: "Access denied",
                        message: "You can only edit your own posts",
                    });
                }

                const post = new PostModel(
                    id,
                    existingPost.userid,
                    cleanTitle,
                    existingPost.createdAt,
                    cleanContent,
                );

                await PostModel.update(post);

                return res.redirect("/post/member");
            }

            return res.status(400).render("status.ejs", {
                status: "Invalid action",
                message: "The requested action is not valid",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Database error",
                message: "An error occurred while processing the post",
            });
        }
    }
    
    // ==================== TRAINER MICROBLOG ====================

    // Display all microblog posts for the logged-in trainer
static async viewTrainerPosts(req, res) {

        // Start error handling for the database and page-loading code
    try {

        // Retrieve all microblog posts from the database using the PostModel
        const posts = await PostModel.getAll();

        // Render the trainer microblog page and send the required data to the EJS view
        return res.render("trainer_post.ejs", {
            // Pass the currently logged-in trainer to the EJS view
            authenticatedUser: req.user,
            
            // Pass all retrieved microblog posts to the EJS view
            posts,
            // No error exists when the page initially loads successfully
            error: null,
        });

    // Catch any error that occurs while retrieving or displaying the posts
    } catch (error) {

        console.error(error); // Print the error in the server console for debugging

        // Return HTTP status 500 and display the application's error page
        return res.status(500).render("status.ejs", {
            status: "Failed to load trainer posts",
            message: "An error occurred while loading trainer posts",
        });
    }
}

    // Display the trainer create-post page
    static viewCreateTrainerPostPage(req, res) {
        return res.render("trainer_create_post.ejs", {
            authenticatedUser: req.user,
            error: null,
        });
    }

    // Handle trainer create, update and delete actions
    static async handleTrainerPost(req, res) {
        try {
            const user = req.user;
            const { action, id, title, content } = req.body;

            // ==================== TRAINER DELETE OWN POST ====================

            if (action === "delete") {
                const existingPost = await PostModel.getById(id);

                    // Check that the post exists
                if (!existingPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                    // Check if the post belongs to the currently logged-in trainer
                if (existingPost.userid !== user.id) {
                    return res.status(403).render("status.ejs", {
                        status: "Access denied",
                        message: "You can only delete your own posts",
                    });
                }

                await PostModel.delete(id); // Delete the trainer's post

                return res.redirect("/post/trainer"); // Return the trainer to the posts page
            }
                // Validate and clean the post title and content
            const { cleanTitle, cleanContent, error } =
                    PostController.validatePost(title, content);

                    // Check if there is a validation error
            if (error) {
            const posts = await PostModel.getAll();  // Get all posts from the database

                // Display the trainer posts page with the validation error
            return res.status(400).render("trainer_post.ejs", {
                authenticatedUser: user, // Send the logged-in trainer to the EJS page
                posts, // Send all posts to the EJS page
                error, // Send the validation error to the EJS page
            });
        }

        // ==================== TRAINER CREATE POST ====================

            // Create a new post for the currently logged-in trainer
            if (action === "create") {
                const post = new PostModel(
                    null, // No ID yet because MySQL creates it automatically
                    user.id, // Use the logged-in trainer's user ID
                    cleanTitle, // Store the validated post title
                    null,  // Created date is generated by the database
                    cleanContent,  // Store the validated post content
                );

                    // Save the new trainer post to the database
                await PostModel.create(post);

                    // Redirect back to the trainer posts page
                return res.redirect("/post/trainer");
            }

            // ==================== TRAINER UPDATE OWN POST ====================

            if (action === "update") {
                    // Get the selected post from the database using its post ID
                const existingPost = await PostModel.getById(id);

                    // Check if the post exists before updating it
                if (!existingPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                    // Check if the post belongs to the currently logged-in trainer
                if (existingPost.userid !== user.id) {

                            // Prevent the trainer from editing another user's post
                    return res.status(403).render("status.ejs", {
                        status: "Access denied",
                        message: "You can only edit your own posts",
                    });
                }

                    // Create a PostModel object with the updated post information
                const post = new PostModel(
                    id,
                    existingPost.userid,
                    cleanTitle,
                    existingPost.createdAt,
                    cleanContent,
                );

                await PostModel.update(post); //Update the existing post in the Database

                return res.redirect("/post/trainer"); // Redirect back to the trainer posts page
            }

            return res.status(400).render("status.ejs", {
                status: "Invalid action",
                message: "The requested action is not valid",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Database error",
                message: "An error occurred while processing the post",
            });
        }
    }

    // Administrator create, update and delete post management
    static async handlePostsManagement(req, res) {
        try {
            const { action, id, title, content, userId } = req.body;

            // ==================== ADMIN DELETE ANY POST ====================

            if (action === "delete") {
                
                // Get the selected post from the database using its post ID
                const existingPost = await PostModel.getById(id);

                    // Check that the post exists before deleting it
                if (!existingPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                    // Delete the selected post from the database
                await PostModel.delete(id);

                    // Redirect the administrator back to post management
                return res.redirect("/post");
            }

            // Validate and clean the post title and content
            const { cleanTitle, cleanContent, error } =
            PostController.validatePost(title, content);

            if (error) {
                    // Get all posts from the database
                const posts = await PostModel.getAll();

                    // Display the admin post management page with the validation error
                return res.status(400).render("post_management.ejs", {
                    authenticatedUser: req.user, // Send the logged-in user's information to the EJS page
                    posts, // Send all posts to the EJS page
                    selectedPost: null, // No post is currently selected
                    search: "",  // No search term is currently being used
                    error, // Send the validation error message to the EJS page
                });
            }

            // ==================== TRAINER CREATE POST ====================

            if (action === "create") {

                        // Create a new PostModel object with the post information
                const post = new PostModel(
                    null, //No ID yet because mySQL creates it automatically
                    Number(userId) || req.user.id, // Use the selected user ID or the logged-in user's ID
                    cleanTitle,  // Store the validated post title
                    null, // Created date is generated by the database
                    cleanContent,  // Store the validated post content
                );

                    // Save the trainer's post to the database
                await PostModel.create(post);

                    // Redirect back to the trainer posts page
                return res.redirect("/post");
            }

            // ==================== TRAINER UPDATE OWN POST ====================

            if (action === "update") {
                const existingPost = await PostModel.getById(id);// Get the existing post from the database using its post ID

                    // Check if the post exists before trying to update it
                if (!existingPost) {
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }
                    // Create a PostModel object with the updated post information
                const post = new PostModel(
                    id, // Keep the existing post ID
                    existingPost.userid, // Keep the ID of the user who created the post
                    cleanTitle, // Store the validated updated title
                    existingPost.createdAt, // Keep the original creation date
                    cleanContent, // Store the validated updated content
                );

                await PostModel.update(post); // Update the existing post in the MySQL database

                return res.redirect("/post"); // Redirect back to the posts page after updating
            }

            return res.status(400).render("status.ejs", {
                status: "Invalid action",
                message: "The requested action is not valid",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).render("status.ejs", {
                status: "Database error",
                message: "An error occurred while processing the request",
            });
        }
    }
}