import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a community blog post in the High Street Gym system.
 *
 * Extends DatabaseModel to manage post data in MySQL.
 * Allows posts to be created, retrieved, updated and deleted.
 *
 * Also provides methods for retrieving posts with their
 * author's details and deleting posts belonging to a user.
 */
export class PostModel extends DatabaseModel{

    /**
     * Creates a new PostModel instance.
     *
     * Stores the post ID, user ID, title, creation date,
     * content and the author's first and last name.
     *
     * @constructor
     * @param {number} id - The unique ID of the post.
     * @param {number} userid - The ID of the user who created the post.
     * @param {string} title - The title of the post.
     * @param {Date|string} createdAt - The date and time the post was created.
     * @param {string} content - The main content of the post.
     * @param {string|null} [firstName=null] - The author's first name.
     * @param {string|null} [lastName=null] - The author's last name.
     */
    constructor(id, userid, title, createdAt, content, firstName = null, lastName = null){
        super(); //Calls parent class constructor
        this.id = id; //Stores Post ID 
        this.userid = userid; // Stores the ID of the user who created the post
        this.title = title; // Stores the post title
        this.createdAt = createdAt;// Stores the date and time the post was created
        this.content = content; //Stores the main content of the post
        this.firstName = firstName; //Stores the author's first name if availiable
        this.lastName = lastName; //Stores the author's Last name if availiable
        }

    /**
     * Converts a database row into a PostModel object.
     *
     * Retrieves the post information from the database row
     * and creates a new PostModel instance.
     *
     * Also includes the author's first and last name
     * when available from the joined users table.
     *
     * @static
     * @param {Object} row - The database row containing post information.
     * @returns {PostModel} A new PostModel object containing the post details.
     */
    static tableToModel(row){

        // Get the post data from the row depending on how the query returned it
        const postRow = row.post || row.posts || row;

        // Create and return a new PostModel using the database data
        return new PostModel(
            postRow.post_id,
            postRow.user_id,
            postRow.title,
            postRow.created_at,
            postRow.content,

            // Get the author's name from the joined users table
            row.first_name,
            row.last_name,
        );
    }
 
 
    /**
     * Retrieves all community blog posts from the MySQL database.
     *
     * Uses an INNER JOIN to retrieve each post together
     * with the author's first and last name.
     *
     * Orders posts by creation date in descending order
     * and converts each row into a PostModel object.
     *
     * @static
     * @async
     * @returns {Promise<PostModel[]>} A promise resolving
     * to an array of all community blog posts.
     */
    static async getAll() {
        
    // Select all post information and the author's first and last name
        return this.query(
            `
             SELECT 
            posts.*,
            users.first_name,
            users.last_name
        FROM posts
        INNER JOIN users
            ON posts.user_id = users.user_id
        ORDER BY posts.created_at DESC
            `,
        ).then((results) => {

            // Convert every database row into a PostModel object
            return results.map((row) => this.tableToModel(row));
        });
    }

/**
 * Retrieves a community blog post using its unique ID.
 *
 * Uses a parameterised SQL query to find the matching
 * post together with the author's first and last name.
 *
 * Returns null if the post does not exist.
 *
 * @static
 * @async
 * @param {number} id - The unique ID of the post.
 * @returns {Promise<PostModel|null>} A promise resolving
 * to the matching post or null if not found.
 */
static async getById(id) {

    // Select the post where post_id matches the provided ID
    return this.query(
        `
        SELECT
        posts.*,
        users.first_name,
        users.last_name
    FROM posts
    INNER JOIN users
        ON posts.user_id = users.user_id
    WHERE posts.post_id = ?
        `,
        [id]
    ).then((result) => {

        // Check if a matching post was found
        if (result.length > 0) {
            // Convert the database row into a PostModel object
            return this.tableToModel(result[0]);
        }

        // Return null if the post does not exist
        return null;
        });
    }

    /**
     * Creates a new community blog post in the MySQL database.
     *
     * Uses an INSERT query to save the user ID,
     * post title and content in the posts table.
     *
     * @static
     * @async
     * @param {PostModel} post - The post details to insert.
     * @returns {Promise<Object>} A promise resolving
     * to the database INSERT query result.
     */
    static async create(post) {

        // Insert the user ID, title and content into the posts table
        return this.query(
        `
        INSERT INTO posts (user_id, title, content)
        VALUES (?, ?, ?)
        `,

        // Values replace the ? placeholders in the SQL query
        [post.userid, post.title, post.content],
        );
    }

    /**
     * Updates an existing community post blog in the database.
     *
     * Uses a parameterised UPDATE query to change
     * the user ID, title and content of the post.
     *
     * Identifies the post using its unique post ID.
     *
     * @static
     * @async
     * @param {PostModel} post - The updated post details.
     * @returns {Promise<Object>} A promise resolving
     * to the database UPDATE query result.
     */
    static async update(post){

        // Update the post that matches the provided post ID
        return this.query(
            `
            UPDATE posts
            SET user_id = ?, title = ?, content = ?
            WHERE post_id = ?
            `,

            // Supply the new values and the ID of the post being updated
            [post.userid, post.title, post.content, post.id],
        );
    }

    /**
     * Permanently deletes all blog posts belonging to a user.
     *
     * Uses a parameterised DELETE query to remove
     * posts associated with the specified user ID.
     *
     * This can be used when a user account is deleted.
     *
     * @static
     * @async
     * @param {number} userId - The unique ID of the user.
     * @returns {Promise<Object>} A promise resolving
     * to the database DELETE query result.
     */
    static async deleteByUserId(userId) {
        return this.query(
            `
            DELETE FROM posts
            WHERE user_id = ?
            `,
            [userId],
        );
    }

    /**
     * Permanently deletes a community blog post from the database.
     *
     * Uses a parameterised DELETE query to remove
     * the post with the specified post ID.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the post to delete.
     * @returns {Promise<Object>} A promise resolving
     * to the database DELETE query result.
     */
    static async delete(id) {
        return this.query(
            `
            DELETE FROM posts
            WHERE post_id = ?
            `,
            [id],
        );
    }
}

// TEST
//PostModel.getAll().then(console.log);