import express from "express";
import { PostModel } from "../models/PostModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * Handles blog and microblog management in the High Street Gym system.
 *
 * Provides routes for viewing, creating, updating
 * and deleting blog posts.
 *
 * Supports public blog viewing and separate post
 * management interfaces for members, trainers and administrators.
 *
 * Validates post titles and content before saving
 * and uses PostModel to interact with the MySQL database.
 *
 * Applies role-based authorisation to protected routes
 * and ownership checks for member and trainer posts.
 */
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

    /**
     * Checks whether the supplied text contains HTML-like tags.
     *
     * Uses a regular expression to detect HTML-like markup
     * in post titles and content during validation.
     *
     * @static
     * @param {string} [text=""] - The text to check for HTML-like tags.
     * @returns {boolean} True if HTML-like tags are detected,
     * otherwise false.
     */
    static containsDangerousHTML(text = "") {
        return /<[^>]*>/i.test(text);
    }

    /**
     * Validates and cleans a blog post's title and content.
     *
     * Removes leading and trailing whitespace from both fields.
     *
     * Checks required fields, length restrictions,
     * uppercase title requirements and HTML-like input.
     *
     * Returns the cleaned values and any validation
     * error message without saving data to the database.
     *
     * @static
     * @param {string} title - The submitted blog post title.
     * @param {string} content - The submitted blog post content.
     * @returns {Object} An object containing cleanTitle,
     * cleanContent and an error message or null.
     */
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

    /**
     * Retrieves and displays all posts on the public blog.
     *
     * Uses PostModel to retrieve blog posts from MySQL
     * and renders them using the public blog EJS template.
     *
     * Allows visitors to view community posts without
     * requiring a specific user role.
     *
     * Renders an error page with HTTP 500
     * if the posts cannot be loaded.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object used to render the blog page.
     * @returns {Promise<Object>} A promise resolving to the rendered blog page or error response.
     */
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

    /**
     * Retrieves and displays blog posts for administrators.
     *
     * Uses PostModel to load all posts from the database.
     *
     * Supports optional searching by post title or content
     * using case-insensitive text matching.
     *
     * Optionally retrieves a selected post using its ID.
     *
     * Renders the administrator post management EJS page
     * or HTTP 500 if the posts cannot be retrieved.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing optional search and post ID values.
     * @param {Object} res - The Express response object used to render the management page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
    static async viewPosts(req, res) {
        try {
            let posts = await PostModel.getAll(); // Retrieve all blog posts from the MySQL database
            const search = req.query.search || ""; // Get the search query from the URL, or use an empty string if none exists

            // Only filter posts if the user has entered a search term
            if (search.trim()) {
                const keyword = search.trim().toLowerCase(); // Remove extra spaces and convert the search term to lowercase

                 // Filter posts by matching the search term against the title or content
                posts = posts.filter(
                    (post) =>
                        // Check whether the post title contains the search term
                        (post.title || "")
                            .toLowerCase()
                            .includes(keyword) ||
                            // Check whether the post content contains the search term
                        (post.content || "")
                            .toLowerCase()
                            .includes(keyword),
                );
            }

            // Convert the selected post ID from the URL parameter into a number
            const selectedId = Number(req.params.id);

            // If the post ID is invalid, set selectedPost to null
            // Otherwise, retrieve the selected post from the MySQL database
            const selectedPost = Number.isNaN(selectedId)
                ? null
                : await PostModel.getById(selectedId);

            // Render the administrator post management page with the required data
            return res.render("post_management.ejs", {
                authenticatedUser: req.user, // Currently logged-in administrator
                posts, // List of retrieved or filtered posts
                selectedPost,  // Selected post for editing, or null
                search,  // Current search query
                error: null, // No error occurred while loading the page
            });
        } catch (error) {
            console.error(error); // Log any errors that occur while retrieving or displaying posts

            // Return HTTP 500 and display an error page if loading posts fails
            return res.status(500).render("status.ejs", {
                status: "Failed to load posts",
                message: "An error occurred while loading the posts",
            });
        }
    }

    /**
     * Retrieves and displays a specific blog post using its ID.
     *
     * Converts the post ID from the URL into a number
     * and validates the supplied identifier.
     *
     * Uses PostModel to retrieve the selected post
     * and loads the available blog posts.
     *
     * Renders the post management EJS page
     * with the selected post information.
     *
     * Returns HTTP 400 for an invalid post ID,
     * HTTP 404 if the post does not exist
     * or HTTP 500 if an unexpected error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the requested post ID.
     * @param {Object} res - The Express response object used to render the post page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
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

    /**
     * Retrieves and displays community blog posts for members.
     *
     * Uses PostModel to retrieve all blog posts
     * from the MySQL database.
     *
     * Renders the member posts EJS page with
     * the authenticated member and community posts.
     *
     * Returns HTTP 500 if the posts cannot be loaded.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated member.
     * @param {Object} res - The Express response object used to render the member posts page.
     * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
     */
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

    /**
     * Displays the page for members to create new blog posts.
     *
     * Renders the member create-post EJS template
     * and passes the authenticated member to the view.
     *
     * Initialises the error value to null.
     *
     * @static
     * @param {Object} req - The Express request object containing the authenticated member.
     * @param {Object} res - The Express response object used to render the create-post page.
     * @returns {Object} The Express response rendering the member create-post page.
     */
    static viewCreateMemberPostPage(req, res) {
        return res.render("member_create_post.ejs", {
            authenticatedUser: req.user,
            error: null,
        });
    }

    /**
     * Handles creating, updating and deleting member blog posts.
     *
     * Retrieves the authenticated member and submitted
     * post details from the request body.
     *
     * Validates post titles and content using validatePost().
     *
     * Allows members to create posts associated
     * with their own user ID.
     *
     * Checks post ownership before allowing members
     * to update or delete existing posts.
     *
     * Uses PostModel to create, update and delete
     * post records in the MySQL database.
     *
     * Redirects to the member posts page on success.
     * Returns HTTP 400 for invalid input or actions,
     * HTTP 403 for forbidden access, HTTP 404 for missing posts,
     * or HTTP 500 if a database operation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated member and submitted post details.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the member post management response.
     */
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

            // Check if the submitted title or content failed validation
            if (error) {
                const posts = await PostModel.getAll();  // Retrieve all posts from the MySQL database

                // Filter the posts to include only those created by the logged-in member
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

            // ==================== MEMBER CREATE POST ====================

            // Check whether the member has requested to create a new post
            if (action === "create") {

                 // Create a new PostModel object using the validated post details
                const post = new PostModel(
                    null, // No post ID yet because MySQL generates it
                    user.id, // Associate the post with the logged-in member
                    cleanTitle, // Validated post title
                    null, // Creation date is generated by the database
                    cleanContent, // Validated post content
                );

                await PostModel.create(post); // Save the new member post to the MySQL database

                return res.redirect("/post/member"); // Redirect the member back to the posts page after creating the post
            }

            // ==================== MEMBER UPDATE OWN POST ====================

            // Check whether the member has requested to update an existing post
            if (action === "update") {

                 // Retrieve the selected post from the database using its ID
                const existingPost = await PostModel.getById(id);

                 // Check whether the requested post exists
                if (!existingPost) {

                    // Return HTTP 404 if the post cannot be found
                    return res.status(404).render("status.ejs", {
                        status: "Post not found",
                        message: "The requested post was not found",
                    });
                }

                // Verify that the post belongs to the logged-in member
                if (existingPost.userid !== user.id) {

                    // Return HTTP 403 to prevent members from editing other users' posts
                    return res.status(403).render("status.ejs", {
                        status: "Access denied",
                        message: "You can only edit your own posts",
                    });
                }

                 // Create a PostModel object containing the updated post details
                const post = new PostModel(
                    id, // Keep the existing post ID
                    existingPost.userid, // Keep the original author's user ID
                    cleanTitle, // Updated and validated post title
                    existingPost.createdAt,  // Preserve the original creation date
                    cleanContent, // Updated and validated post content
                );

                await PostModel.update(post);  // Update the existing post record in the MySQL database

                return res.redirect("/post/member"); // Redirect the member back to the posts page after updating
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

/**
 * Retrieves and displays community microblog posts for trainers.
 *
 * Uses PostModel to retrieve all blog posts
 * from the MySQL database.
 *
 * Renders the trainer posts EJS page
 * with the authenticated trainer and post information.
 *
 * Returns HTTP 500 if the posts cannot be loaded.
 *
 * @static
 * @async
 * @param {Object} req - The Express request object containing the authenticated trainer.
 * @param {Object} res - The Express response object used to render the trainer posts page.
 * @returns {Promise<Object>} A promise resolving to the rendered page or error response.
 */
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

    
    /**
     * Displays the page for trainers to create new microblog posts.
     *
     * Renders the trainer create-post EJS template
     * and provides the authenticated trainer's information.
     *
     * Initialises the error value to null.
     *
     * @static
     * @param {Object} req - The Express request object containing the authenticated trainer.
     * @param {Object} res - The Express response object used to render the create-post page.
     * @returns {Object} The Express response rendering the trainer create-post page.
     */
    static viewCreateTrainerPostPage(req, res) {
        return res.render("trainer_create_post.ejs", {
            authenticatedUser: req.user,
            error: null,
        });
    }
 
    /**
     * Handles creating, updating and deleting trainer microblog posts.
     *
     * Retrieves the authenticated trainer and submitted
     * post details from the request body.
     *
     * Validates post titles and content using validatePost().
     *
     * Allows trainers to create posts associated
     * with their own user ID.
     *
     * Checks post ownership before allowing trainers
     * to update or delete their existing posts.
     *
     * Uses PostModel to create, update and delete
     * microblog records in the MySQL database.
     *
     * Redirects to the trainer posts page on success.
     * Returns HTTP 400 for invalid input or actions,
     * HTTP 403 for forbidden access, HTTP 404 for missing posts,
     * or HTTP 500 if a database operation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated trainer and submitted post details.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the trainer post management response.
     */
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

    /**
     * Handles administrator blog post management operations.
     *
     * Retrieves the requested CRUD action, post ID,
     * title, content and optional user ID from the form.
     *
     * Allows administrators to create, update
     * and delete blog posts in the MySQL database.
     *
     * Validates post titles and content using validatePost().
     *
     * When creating a post, assigns it to the selected user
     * or the authenticated administrator.
     *
     * When updating a post, preserves the original
     * user ID and creation date.
     *
     * Uses PostModel to perform database operations.
     *
     * Redirects to the administrator post management page
     * on success or displays an error page if an operation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the administrator and submitted post details.
     * @param {Object} res - The Express response object used for redirects and error pages.
     * @returns {Promise<Object>} A promise resolving to the administrator post management response.
     */
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

            // ==================== ADMIN CREATE POST ====================

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

            // ==================== ADMIN UPDATE POST ====================

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