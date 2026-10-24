import { DatabaseModel } from "./DatabaseModel.mjs";

export class PostModel extends DatabaseModel{

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

    // Convert a database table row into a PostModel object
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
 
 // Get all posts from the database to display on the community blog
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

    // Get one post from the database using its post ID
static async getById(id) {

    // Select the post where post_id matches the provided ID
    return this.query(
        `
        SELECT *
        FROM posts
        WHERE post_id = ?
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

    // Create a new post in the database
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

    //Update an existing post in the Database
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

    // Delete all posts belonging to a user when their account is deleted
    static async deleteByUserId(userId) {
        return this.query(
            `
            DELETE FROM posts
            WHERE user_id = ?
            `,
            [userId],
        );
    }

    //Delete an existing Post using its Post ID
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