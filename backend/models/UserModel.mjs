import { DatabaseModel } from "./DatabaseModel.mjs";
// UserModel handles all database operations for the users table

export class UserModel extends DatabaseModel {
    
        // Constructor - creates a User object
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

        // Converts a database row into a UserModel object
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

        // Gets all users from the database
    static async getAll() {

         // Run the SQL query and return the database result
        return this.query(
            "SELECT * FROM users"
        ).then((results) => {
            return results.map((row) => this.tableToModel(row));
        });
    }

    //Gets a user by ID
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

    // Get a user by their email address
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

             // Return null if no user was found
            return null;
        });
    }

// Find a user using their authentication key
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

    // Get all users that have a specific role
    static getByRole(role) {

         // Run the SQL query and return the database result
        return this.query(
            `SELECT * FROM users WHERE role = ?`,
            [role]
        ).then(results => 
            results.map(row => this.tableToModel(row))
        );
    }

    // Creates and stores a new user in the MySQL database
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
    
    //Updates User
    // Updates the selected user's details in the MySQL database
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
    // Permanently delete a user from the database using their ID
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