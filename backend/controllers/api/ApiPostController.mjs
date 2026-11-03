import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { PostModel } from "../../models/PostModel.mjs";

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
// Retrieves all blog posts from MySQL.
// Returns JSON with HTTP 200 or HTTP 500 if loading fails.
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

// ========== POST - CREATE BLOG POST ==========
// Creates a new blog post for the authenticated user.
// Saves the post to MySQL and returns HTTP 201 on success.
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
// Retrieves a specific blog post from MySQL.
// Checks that the authenticated user owns the post.
// Returns HTTP 403 for forbidden access and 404 if not found.
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
// Validates the post ID and checks that the post exists.
// Only allows the post owner to delete it.
// Returns HTTP 200 on successful deletion.
    static async deletePost(req, res) {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({
                    message: "Invalid post ID"
                });
            }

            const post = await PostModel.getById(id);

            if (!post) {
                return res.status(404).json({
                    message: "Post not found",
                });
            }

            if (post.userid !== req.authenticatedUser.id) {
                return res.status(403).json({
                    message: "Forbidden"
                });
            }

            await PostModel.delete(id);

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

