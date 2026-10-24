import { DatabaseModel } from "./DatabaseModel.mjs";
import { UserModel } from "./UserModel.mjs";
import { PostModel } from "./PostModel.mjs";

// Combines post data with the user who created the post
export class UserPostModel extends DatabaseModel {

    // Create a UserPostModel object containing post and user data
    constructor(posts, users) {
        super(); //Call parent class constructor
        this.posts = posts;
        this.users = users;
    }

    // Convert joined database rows into PostModel and UserModel objects
    static tableToModel(row) {
        return new UserPostModel(
            PostModel.tableToModel(row.posts),
            UserModel.tableToModel(row.users),
        );
    }

    // Get all posts together with the user who created each post
    static async getAll() {

         // Join the posts and users tables using user_id
        const results = await this.query(`
            SELECT
        post.*,
        user.*

        FROM posts AS post

        INNER JOIN users AS user
        ON post.user_id = user.user_id
        `);

        // Convert each joined database row into a UserPostModel object
        return results.map((row) => this.tableToModel(row));
    }

     // Get one post by ID together with the user who created it
    static async getById(id) {

        // Join the post with its matching user and find the selected post
        const results = await this.query(
            `
        SELECT
        post.*,
        user.*

      FROM posts AS post

      INNER JOIN users AS user
        ON post.user_id = user.user_id

      WHERE post.post_id = ?
            `,

            // Send the post ID into the SQL placeholder
            [id],
        );

        // Return null if the post was not found
        if (results.length === 0) {
            return null;
        }

        // Convert the first matching row into a UserPostModel object
        return this.tableToModel(results[0]);
    }

     // Get all posts created by users with a specific role
      static async getAllByRole(role) {

        // Join posts with users and filter the results by user role
        const results = await this.query(
             `
        SELECT
            post.*,
            user.*

        FROM posts AS post

        INNER JOIN users AS user
            ON post.user_id = user.user_id

        WHERE user.role = ?

        ORDER BY post.created_at DESC
        `,

        // Send the selected role into the SQL placeholder
        [role]
        );

         // Convert each matching row into a UserPostModel object
        return results.map((row) => this.tableToModel(row));
      }
}