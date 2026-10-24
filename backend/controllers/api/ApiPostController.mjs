import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { PostModel } from "../../models/PostModel.mjs";

export class ApiPostController{
    static routes = express.Router();

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

