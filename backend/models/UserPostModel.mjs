import { DatabaseModel } from "./DatabaseModel.mjs";
import { UserModel } from "./UserModel.mjs";
import { PostModel } from "./PostModel.mjs";

/**
 * Represents a community blog post together with its author.
 *
 * Extends DatabaseModel to retrieve post and user data
 * from the High Street Gym MySQL database.
 *
 * Provides methods for retrieving posts with their
 * related user information and filtering posts by user role.
 */
export class UserPostModel extends DatabaseModel {

    /**
     * Creates a new UserPostModel instance.
     *
     * Stores the post information together with
     * the user who created the post.
     *
     * @constructor
     * @param {PostModel} posts - The post containing its details.
     * @param {UserModel} users - The user who created the post.
     */
    constructor(posts, users) {
        super(); //Call parent class constructor
        this.posts = posts;
        this.users = users;
    }

    /**
     * Converts a joined database row into a UserPostModel object.
     *
     * Uses the tableToModel methods from PostModel and UserModel
     * to convert the post and user data into model objects.
     *
     * Combines both objects into a new UserPostModel instance.
     *
     * @static
     * @param {Object} row - The database row containing post and user information.
     * @returns {UserPostModel} A new object containing the post and its author.
     */
    static tableToModel(row) {
        return new UserPostModel(
            PostModel.tableToModel(row.posts),
            UserModel.tableToModel(row.users),
        );
    }

    /**
     * Retrieves all community blog posts with their authors.
     *
     * Uses an INNER JOIN to connect the posts and users tables
     * using the user ID associated with each post.
     *
     * Converts each returned database row into a UserPostModel object.
     *
     * @static
     * @async
     * @returns {Promise<UserPostModel[]>} A promise resolving
     * to an array of posts with their related user details.
     */
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

    /**
     * Retrieves a community blog post using its unique ID.
     *
     * Uses an INNER JOIN to retrieve the selected post
     * together with the user who created it.
     *
     * Returns null if the post does not exist.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the post.
     * @returns {Promise<UserPostModel|null>} A promise resolving
     * to the matching post and author or null if not found.
     */
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

     /**
     * Retrieves community blog posts created by users with a specific role.
     *
     * Uses an INNER JOIN to connect posts with their authors
     * and filters the results using the selected user role.
     *
     * Orders posts by creation date in descending order.
     *
     * Converts each matching row into a UserPostModel object.
     *
     * @static
     * @async
     * @param {string} role - The user role used to filter posts.
     * @returns {Promise<UserPostModel[]>} A promise resolving
     * to an array of posts created by users with the specified role.
     */
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