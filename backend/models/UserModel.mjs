import { DatabaseModel } from "./DatabaseModel.mjs";
// UserModel handles all database operations for the users table

/**
 * Represents a user in the High Street Gym system.
 *
 * Extends DatabaseModel to manage user data in MySQL.
 * Allows users to be created, retrieved, updated and deleted.
 *
 * Also provides methods for finding users by their ID,
 * email address, authentication key and assigned role.
 */
export class UserModel extends DatabaseModel {
    
    /**
     * Creates a new UserModel instance.
     *
     * Stores the user's ID, first name, last name, email,
     * password hash, role, creation date and authentication key.
     *
     * @constructor
     * @param {number} id - The unique ID of the user.
     * @param {string} firstName - The user's first name.
     * @param {string} lastName - The user's last name.
     * @param {string} email - The user's email address.
     * @param {string} passwordHash - The user's hashed password.
     * @param {string} role - The user's assigned role.
     * @param {Date|string} createdAt - The date the account was created.
     * @param {string|null} [authenticationKey=null] - The user's authentication key.
     */
    constructor(
        id, 
        firstName, 
        lastName, 
        email, 
        passwordHash, 
        role, 
        createdAt, 
        authenticationKey = null,
    ) {
        super(); // Call the parent DatabaseModel constructor

        // Store the user's information in the UserModel object
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = createdAt;
        this.authenticationKey = authenticationKey;
    }

    /**
     * Converts a database row into a UserModel object.
     *
     * Retrieves the user information from the database row
     * and creates a new UserModel instance.
     *
     * Supports rows containing nested user information.
     *
     * @static
     * @param {Object} row - The database row containing user information.
     * @returns {UserModel} A new UserModel object containing the user details.
     */
    static tableToModel(row) {
        const userRow = row.user || row.users || row;
        return new UserModel(
            userRow.user_id,
            userRow.first_name,
            userRow.last_name,
            userRow.email,
            userRow.password_hash,
            userRow.role,
            userRow.created_at,
            userRow.authentication_key,

        );
    }

    /**
     * Retrieves all users from the MySQL database.
     *
     * Executes a SELECT query on the users table
     * and converts each returned row into a UserModel object.
     *
     * @static
     * @async
     * @returns {Promise<UserModel[]>} A promise resolving
     * to an array of all registered users.
     */
    static async getAll() {

         // Run the SQL query and return the database result
        return this.query(
            "SELECT * FROM users"
        ).then((results) => {
            return results.map((row) => this.tableToModel(row));
        });
    }

    
    /**
     * Retrieves a user from the database using their unique ID.
     *
     * Uses a parameterised SQL query to find the matching
     * user record in the users table.
     *
     * Returns null if the user does not exist.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the user.
     * @returns {Promise<UserModel|null>} A promise resolving
     * to the matching user or null if not found.
     */
    static async getById(id) {

         // Run the SQL query and return the database result
        return this.query(
        "SELECT * FROM users WHERE user_id = ?",
            [id]
        ).then((result) => {
            if (result.length > 0) {
                return this.tableToModel(result[0]);
            }
            return null; //Return NULL if user is not found
        });
    }

    // ==================== CHECK IF EMAIL ALREADY EXISTS ====================

    /**
     * Retrieves a user using their email address.
     *
     * Searches the users table for an existing account
     * with the specified email address.
     *
     * Can be used to check whether an email is already
     * registered before creating a new user account.
     *
     * @static
     * @async
     * @param {string} email - The email address to search for.
     * @returns {Promise<UserModel|null>} A promise resolving
     * to the matching user or null if the email is not found.
     */
    static async getByEmail(email) {
        
        // Run the SELECT query and return the database result
        return this.query(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,

            // Pass the email value into the ? placeholder to help prevent SQL injection
            [email]

            // Wait for the query result
        ).then((result) => {

             // Check if at least one matching user was found
            if(result.length > 0) {

                // Convert the first database row into a UserModel object
                return this.tableToModel(result[0]);
            }

            // If the email does not exist, return null
            // The registration controller can then proceed with account creation
            return null;
        });
    }

/**
 * Retrieves a user using their authentication key.
 *
 * Searches the users table for an account with
 * the supplied authentication key.
 *
 * Returns the matching user if the key exists,
 * otherwise returns null.
 *
 * @static
 * @async
 * @param {string} authenticationKey - The authentication key used to find the user.
 * @returns {Promise<UserModel|null>} A promise resolving
 * to the matching user or null if the key is not found.
 */
static async getByAuthenticationKey(authenticationKey) {
    const results = await this.query(
        `
        SELECT *
        FROM users
        WHERE authentication_key = ?
        `,
        [authenticationKey],
    );

    // Return the authenticated user if the key exists
    if (results.length > 0) {
        return this.tableToModel(results[0]);
    }

    // Return null if the authentication key is invalid
    return null;
    }

    /**
     * Retrieves all users assigned to a specific role.
     *
     * Uses a parameterised SQL query to find users
     * whose role matches the supplied value.
     *
     * Converts each returned database row into a UserModel object.
     *
     * @static
     * @param {string} role - The user role to search for.
     * @returns {Promise<UserModel[]>} A promise resolving
     * to an array of users with the specified role.
     */
    static getByRole(role) {

         // Run the SQL query and return the database result
        return this.query(
            `SELECT * FROM users WHERE role = ?`,
            [role]
        ).then(results => 
            results.map(row => this.tableToModel(row))
        );
    }

    /**
     * Creates a new user account in the MySQL database.
     *
     * Uses an INSERT query to save the user's first name,
     * last name, email, password hash, role and authentication key.
     *
     * @static
     * @async
     * @param {UserModel} user - The user details to insert.
     * @returns {Promise<Object>} A promise resolving
     * to the database INSERT query result.
     */
    static async create(user) {

         // Run the SQL query and return the database result
        return this.query(
             `
      INSERT INTO users
      (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        authentication_key
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,

      // Replace the placeholders with the new user's values
        [
        user.firstName,
        user.lastName,
        user.email,
        user.passwordHash,
        user.role,
        user.authenticationKey,
            ]
        );
    }
    
    
    /**
     * Updates an existing user account in the database.
     *
     * Uses a parameterised UPDATE query to change
     * the user's personal information, password hash,
     * assigned role and authentication key.
     *
     * Identifies the account using its unique user ID.
     *
     * @static
     * @async
     * @param {UserModel} user - The updated user details.
     * @returns {Promise<Object>} A promise resolving
     * to the database UPDATE query result.
     */
    static async update(user){

         // Run the SQL query and return the database result
        return this.query(
           `
        UPDATE users
        SET
        first_name = ?,
        last_name = ?,
        email = ?,
        password_hash = ?,
        role = ?,
        authentication_key = ?
        WHERE user_id = ?
        `,
        // Replace the placeholders with the updated user's values
        [
        user.firstName,
        user.lastName,
        user.email,
        user.passwordHash,
        user.role,
        user.authenticationKey,
        user.id,
        ]
      );
    }
    
    /**
     * Permanently deletes a user account from the database.
     *
     * Uses a parameterised DELETE query to remove
     * the user with the specified user ID.
     *
     * @static
     * @async
     * @param {number} id - The unique ID of the user to delete.
     * @returns {Promise<Object>} A promise resolving
     * to the database DELETE query result.
     */
    static async delete(id) {

         // Run the SQL query and return the database result
        return this.query(
            `
            DELETE FROM users
            WHERE user_id = ?
            `,
            // Delete only the user with the matching ID
            [id]
        );
    }
}

// TESTING AREA
//UserModel.getAll()
  //  .then((users) => console.log("Users:", users))
   // .catch((error) => console.error("Error:", error));