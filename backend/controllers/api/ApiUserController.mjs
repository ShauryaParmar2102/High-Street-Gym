import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.mjs";

/**
 * Handles user API requests in the High Street Gym system.
 *
 * Provides endpoints for registering new members,
 * retrieving user information and updating user accounts.
 *
 * Uses UserModel to interact with the MySQL database
 * and bcrypt to securely hash user passwords.
 *
 * Applies authentication and authorisation middleware
 * to protect user information and account updates.
 */
export class ApiUserController {
    static routes = express.Router(); // Create an Express router for all user API routes

    // ========== USER API ROUTES ==========
    // Defines POST, GET and PATCH endpoints for user management.
    // Uses authentication middleware and role-based access checks.
    static{
        this.routes.use(ApiAuthenticationController.middleware); // Require authentication for every route in this controller


        this.routes.post("/", this.createNewMember); //Create a New account for a member

             // Get the currently authenticated user's details
        this.routes.get("/self", 
            ApiAuthenticationController.restrict("any"),
            this.getAuthenticatedUser,
        );
            //Update a user's personal info
        this.routes.patch(
            "/:id",
            ApiAuthenticationController.restrict("any"),
            this.UserPersonalInformation,
        );
            //Get a user by ID
        this.routes.get(
            "/:id",
            ApiAuthenticationController.restrict("any"),
            this.getUserbyId,
        );
    }
    // ========== POST - MEMBER REGISTRATION ==========
    /**
     * Creates a new member account in the High Street Gym system.
     *
     * Retrieves registration details from the request body
     * and checks that an email and password are provided.
     *
     * Uses bcrypt to hash the password before saving
     * the new user account to the MySQL database.
     *
     * Assigns the new account the member role.
     *
     * Returns HTTP 201 on successful registration,
     * HTTP 400 for missing required fields
     * or HTTP 500 if account creation fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing member registration details.
     * @param {Object} res - The Express response object used to return registration results.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * indicating whether the member account was created.
     */
    static async createNewMember(req, res) {
        try {
            if(!req.body.email || !req.body.password) {
                return res.status(400).json({
                    message: "Email and Password Required"
                });
            }
                    //Hash the user's password before storing it
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            //Create user's object
            const user = {
                ...req.body,
                passwordHash: hashedPassword,
                role: "member",
            };

            const result = await UserModel.create(user); //Save user in database

            //Return success
            return res.status(201).json({
                id: result.insertId,
                message: "member created successfully",
            });
        } catch (error) {
            console.log(error);
            // Return server error
            return res.status(500).json({
                message: "failed to create user",

                errors: [
                    {
                        path: req.path,
                        message: error.message,
                    },
                ],
            });
        }
    }
// ========== GET - AUTHENTICATED USER ==========
    /**
     * Retrieves the currently authenticated user's information.
     *
     * Gets the logged-in user from the request object
     * and returns their account details as JSON.
     *
     * Includes the user's ID, first name, last name,
     * email address, assigned role and creation date.
     *
     * Returns HTTP 200 with the authenticated user's details.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the authenticated user.
     * @param {Object} res - The Express response object used to return user information.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * containing the authenticated user's account details.
     */
    static async getAuthenticatedUser(req,res) {
        const user = req.authenticatedUser;

        return res.status(200).json({
         id: user.id,
         firstName: user.firstName,
         lastName: user.lastName,
          email: user.email,
          role: user.role,
         createdAt: user.createdAt,
        });
    }
    // ==========  GET - USER BY ID ==========
    /**
     * Retrieves a specific user from the database using their ID.
     *
     * Converts the user ID from the request parameters
     * into a number and validates the supplied ID.
     *
     * Checks that the authenticated user is either
     * requesting their own information or is an administrator.
     *
     * Uses UserModel to retrieve the matching user
     * and returns their account information as JSON.
     *
     * Returns HTTP 200 on success, HTTP 400 for an invalid ID,
     * HTTP 403 for forbidden access, HTTP 404 if the user
     * does not exist or HTTP 500 if an error occurs.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the user ID and authenticated user.
     * @param {Object} res - The Express response object used to return user details.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * containing the requested user or an error message.
     */
    static async getUserbyId(req,res){
        try{
            //Convert URL parameter to a number
            const requestedId = Number(req.params.id);

            const user = req.authenticatedUser; //get the authenticated user

            //Check if ID is valid
            if (Number.isNaN(requestedId)) {
                return res.status(400).json({
                    message: "Invalid User ID"
                });
            }
                  // Only allow the user to view themselves or allow administrators
            if (!user || (user.id !== requestedId && user.role !== "administrator")) {
                return res.status(403).json({
                    message: "Forbidden",
                });
            }
                    //Retrieve user from Database
            const foundUser = await UserModel.getById(requestedId);

            if(!foundUser) {
                return res.status(404).json({
                    message: "user not found",
                });
            }
            return res.status(200).json({
            id: foundUser.id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            role: foundUser.role,
            createdAt: foundUser.createdAt,
        });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Failed to load user",

                errors: [
                    {
                        path: req.path,
                        message: error.message,
                    },
                ],
            });
        }
    }
    // ========== PATCH - UPDATE USER INFORMATION ==========

    /**
     * Updates the authenticated user's personal information.
     *
     * Retrieves the target user ID from the request parameters
     * and verifies that the user is updating their own account.
     *
     * Loads the existing user information from MySQL
     * and updates only the fields supplied in the request body.
     *
     * Preserves existing account details when fields are omitted.
     * Uses bcrypt to hash a new password when one is provided.
     *
     * Saves the updated user information using UserModel.
     *
     * Returns HTTP 200 on success, HTTP 403 for forbidden access,
     * HTTP 404 if the user is not found
     * or HTTP 500 if the update fails.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing the user ID, authenticated user and updated details.
     * @param {Object} res - The Express response object used to send update results.
     * @returns {Promise<Object>} A promise resolving to the HTTP response
     * indicating whether the user information was updated.
     */
    static async UserPersonalInformation(req, res) {
        try {
            const user = req.authenticatedUser;

            const targetUserId = Number(req.params.id);

            if(!user || user.id !== targetUserId) {
                return res.status(403).json({
                    message: "you are not allowed to update this user",
                });
            }

            // Get the user's existing information
            const existingUser = await UserModel.getById(targetUserId);

            if (!existingUser) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

// ========== PATCH - PARTIAL USER UPDATE ==========
// Creates an updated user object using the existing database values.
// Only changes fields provided in the request body.
// Preserves existing values when fields are omitted.
    const updateData = {
        id: targetUserId,
        firstName: req.body.firstName ?? existingUser.firstName,
        lastName: req.body.lastName ?? existingUser.lastName,
        email: req.body.email ?? existingUser.email,
        passwordHash: existingUser.passwordHash,
        role: existingUser.role,
        authenticationKey: existingUser.authenticationKey,
    };

    // Hash the new password if one was provided
    if (req.body.password) {
        updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

            const result = await UserModel.update(updateData);

            if (result.affectedRows === 1) {
                return res.status(200).json({
                    message: "User updated successfully"
                });
            }

            return res.status(404).json({
                message: "User not found",
            });
            
        } catch(error) {
            console.log(error);

            return res.status(500).json({
                message: "failed to update user",

                errors: [
                    {
                        path: req.path,
                        message: error.message,
                    },
                ],
            });
        }
    }
}