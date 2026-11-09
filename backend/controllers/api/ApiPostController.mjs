import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { PostModel } from "../../models/PostModel.mjs";

/**
 * Handles community blog API requests for the High Street Gym system.
 *
 * Provides endpoints for retrieving, creating and deleting
 * blog posts using the PostModel.
 *
 * Applies authentication and role-based authorisation
 * to restrict certain operations to members and trainers.
 *
 * Also checks post ownership before allowing users
 * to view individual posts or delete their own posts.
 */
export class ApiPostController{
    static routes = express.Router();

// ========== BLOG API ROUTES AND AUTHORISATION ==========
// Applies authentication middleware to blog API routes.
// Restricts creating, viewing individual and deleting posts to members and trainers.
    static {
            // Run authentication middleware before all API routes
        this.routes.use(ApiAuthenticationController.middleware);

        this.routes.get("/", this.getPosts); //Get all posts

            // Create a new post (members and trainers only)
        this.routes.post(
            "/",
            ApiAuthenticationController.restrict(["member", "trainer"]), // Allow access only to members and trainers
            this.createPost,
        );

            // Get a specific post by its ID (members and trainers only)
        this.routes.get(
            "/:id",
            ApiAuthenticationController.restrict(["member", "trainer"]), // Allow access only to members and trainers
            this.getPostById,
        );
            // Delete a specific post by its ID (members and trainers only)
        this.routes.delete(
            "/:id",
            ApiAuthenticationController.restrict(["member", "trainer"]), // Allow access only to members and trainers
            this.deletePost,
        );
    }

    // ========== GET - ALL BLOG POSTS ==========

    /**
     * Retrieves all community blog posts from the MySQL database.
     *
     * Uses PostModel to retrieve all posts and returns
     * the results as JSON.
     *
     * Returns HTTP 200 on success or HTTP 500
     * if the posts cannot be retrieved.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object used to return blog posts.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * containing the posts or an error message.
     */
    static async getPosts(req, res) {
        try{ 
            const posts = await PostModel.getAll(); // Retrieve all posts from the database

            
            return res.status(200).json(posts);
        } catch (error){
            return res.status(500).json({
                message: "Failed to load posts from database",
            });
        }
    }

    /**
     * Creates a new community blog post for the authenticated user.
     *
     * Retrieves the user's ID and the post details
     * from the request body.
     *
     * Uses PostModel to save the new post in MySQL.
     *
     * Returns HTTP 201 when the post is created,
     * HTTP 401 if the user is not authenticated,
     * or HTTP 500 if an error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated user and post details.
     * @param {Object} res - The Express response object used to send the creation result.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * indicating whether the post was created successfully.
     */
    static async createPost(req, res) {
        try {
            // Check that a user is authenticated
            if (!req.authenticatedUser) {
                return res.status(401).json({message: "Unauthorized"});
            }
            // Create a new post using the logged-in user's details
            const post = new PostModel(
            null,
            req.authenticatedUser.id,
            req.body.post.title,
            null,
            req.body.post.content,
            );
            
            const result = await PostModel.create(post); // Save the new post to the database

            // Return the new post ID and success message
            return res.status(201).json({
                id: result.insertId,
                message: "Post created.",
            });
        } catch(error) {
            console.log(error);
            return res.status(500).json({
                message: "Failed to create post"
            });
        }
    }

    // ========== GET - BLOG POST BY ID ==========

    /**
     * Retrieves a specific community blog post using its ID.
     *
     * Converts the post ID from the request parameters
     * and validates that it is a number.
     *
     * Retrieves the post from MySQL and checks
     * that the authenticated user is the post owner.
     *
     * Returns HTTP 200 on success, HTTP 400 for an invalid ID,
     * HTTP 403 for forbidden access, HTTP 404 if the post
     * does not exist, or HTTP 500 if an error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the post ID and authenticated user.
     * @param {Object} res - The Express response object used to return the post or an error.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * containing the requested post or an error message.
     */
    static async getPostById(req, res) {
        try {
            // Convert the post ID from the URL to a number
            const id = Number(req.params.id);

            // Check that the post ID is valid
            if (Number.isNaN(id)) {
                return res.status(400).json({
                    message: "Invalid post ID"
                });
            }

            const post = await PostModel.getById(id); // Retrieve the post from the database
            // Check that the post exists
            if(!post) {
                return res.status(404).json({
                    message: "Post not found",
                });
            }

            // Check that the logged-in user owns the post
            if(post.userid !== req.authenticatedUser.id) {
                return res.status(403).json({
                    message: "Forbidden"
                });
            }

            

           // Return the selected post without deleting it
        return res.status(200).json(post);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "failed to delete post",
            });
        }

         }

    // ========== DELETE - BLOG POST ==========

    /**
     * Permanently deletes a community blog post using its ID.
     *
     * Validates the post ID and retrieves the matching
     * post from the MySQL database.
     *
     * Checks that the authenticated user owns the post
     * before allowing it to be deleted.
     *
     * Returns HTTP 200 on successful deletion,
     * HTTP 400 for an invalid ID, HTTP 403 for forbidden access,
     * HTTP 404 if the post does not exist,
     * or HTTP 500 if an error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the post ID and authenticated user.
     * @param {Object} res - The Express response object used to send deletion results.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * indicating whether the post was deleted successfully.
     */
    static async deletePost(req, res) {
        try {
            // Convert the post ID from the URL parameter into a number
            const id = Number(req.params.id);

            // Check whether the provided post ID is not a valid number
            if (Number.isNaN(id)) {

                // Return HTTP 400 if the post ID is invalid
                return res.status(400).json({
                    message: "Invalid post ID"
                });
            }

            // Retrieve the post from the database using its ID
            const post = await PostModel.getById(id);

            // Check whether the requested post exists
            if (!post) {
                return res.status(404).json({
                    message: "Post not found",
                });
            }

            // Check whether the logged-in user owns the post
            if (post.userid !== req.authenticatedUser.id) {
                return res.status(403).json({
                    message: "Forbidden"
                });
            }

            // Permanently delete the post from the database
            await PostModel.delete(id);

            // Return HTTP 200 to confirm the post was deleted successfully
            return res.status(200).json({
                message: "post deleted successfully",
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "failed to delete post",
            });
        }
    }
}

