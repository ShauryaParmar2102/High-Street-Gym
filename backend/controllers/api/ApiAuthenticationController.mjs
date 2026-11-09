import express from "express";
import { UserModel } from "../../models/UserModel.mjs"; // Import the User model to retrieve users from the database
import bcrypt from "bcryptjs"; // Used to securely hash and compare passwords
import crypto from "crypto"; // Used to generate secure random authentication keys


/**
 * Handles API authentication and authorisation
 * for the High Street Gym system.
 *
 * Provides routes for logging users in and out,
 * generating and removing authentication keys.
 *
 * Also provides middleware to authenticate users
 * and restrict access based on their assigned roles.
 */
export class ApiAuthenticationController {
    static routes = express.Router(); // Router for API authentication endpoints

    static middleware = express.Router(); // Router that contains authentication middleware

    // Configure middleware and authentication routes
    // The # makes the authentication provider a private class member.
    static {
        this.middleware.use(this.#APIAuthenticationProvider); // Run authentication middleware before protected API routes
        this.routes.post("/authenticate", this.handleAuthenticate); // Log a user in and generate an authentication key
        this.routes.delete("/authenticate", this.#APIAuthenticationProvider, this.handleAuthenticate); // Verify the user is authenticated before removing the authentication key
    }
    
    // ========== AUTHENTICATION MIDDLEWARE ==========

    /**
     * Authenticates API requests using an authentication key.
     *
     * Reads the Authentication-Key header and searches
     * for the matching user in the MySQL database.
     *
     * Stores the authenticated user in the request object.
     *
     * @static
     * @async
     * @private
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     * @param {Function} next - Continues to the next middleware.
     * @returns {Promise<Object|undefined>} The response
     * or undefined when the request continues.
     */
    static async #APIAuthenticationProvider(req, res, next) {
        const authenticationKey = req.get("Authentication-Key");

        // Check if an authentication key was provided
        if (authenticationKey) {
            try {
                // Find the user associated with the authentication key
                req.authenticatedUser =
                    await UserModel.getByAuthenticationKey(authenticationKey);
                
            } catch (error) {
                if (error == "not found") {
                    return res.status(401).json({
                        message: "Invalid authentication key - key not found",
                    });
                } else {
                    console.error(error);
                    return res.status(500).json({
                        message: "Failed to authenticate: database error",
                    });
                }
            }
        }

        next(); // Continue to next route
    }

    /**
     * Handles user login and logout requests through the API.
     *
     * For POST requests, verifies the user's email and password
     * using bcrypt and generates a unique authentication key.
     *
     * For DELETE requests, removes the authentication key
     * from the authenticated user's account to log them out.
     *
     * Returns appropriate HTTP responses for successful
     * authentication, invalid credentials and server errors.
     *
     * @static
     * @async
     * @param {Object} req - The Express request object containing login details or authentication data.
     * @param {Object} res - The Express response object used to return authentication results.
     * @returns {Promise<Object|undefined>} A promise resolving to an
     * HTTP response or undefined if no request method is handled.
     */
    static async handleAuthenticate(req, res) {
        // Handle user login
        if (req.method == "POST") {
            try {
                const user = await UserModel.getByEmail(req.body.email);  // Find the user using their email address

                // Check that the user exists
                if (!user) {
                    return res.status(401).json({
                        message: "Invalid email or password",
                    });
                }
                // Compare the entered password with the stored password hash
                const passwordMatch = await bcrypt.compare(
                    req.body.password,
                    user.passwordHash,
                );
                // Check that the password is correct
                if (!passwordMatch) {
                    return res.status(401).json({
                        message: "Invalid email or password",
                    });
                }

                const authenticationKey = crypto.randomUUID(); // Generate a unique authentication key for the new user
                user.authenticationKey = authenticationKey;  // Store the authentication key for the logged-in user
                await UserModel.update(user); // Save the updated user to the database

                // Return the authentication key to the frontend after successful login
                return res.status(200).json({
                    authenticationKey, 
                });
            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    message: "Failed to authenticate user",
                });
            }
        }
        // ========== DELETE - USER LOGOUT ==========
        // Checks whether the user is authenticated before logging out.
        // Removes the user's authentication key from the database.
        // Returns HTTP 200 on success, 401 if unauthenticated, or 500 on server error.
        if (req.method === "DELETE") {
    try {
        // Check that a user is currently authenticated
        if (!req.authenticatedUser) {
            return res.status(401).json({
                message: "Please login to access the updated resources",
            });
        }

        // Remove the authentication key from the logged-in user
        req.authenticatedUser.authenticationKey = null;

        // Save the updated user in the database
        await UserModel.update(req.authenticatedUser);

        return res.status(200).json({
            message: "Not Authenticated",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to deauthenticate user",
        });
    }
}
    }

   /**
     * Restricts access to API routes based on user roles.
     *
     * Returns middleware that checks whether a user
     * is authenticated and has permission to access a route.
     *
     * Returns HTTP 401 if the user is not authenticated
     * and HTTP 403 if the user's role is not allowed.
     *
     * Allows the request to continue when the user
     * has the required permissions.
     *
     * @static
     * @param {string|string[]} allowedRoles - The roles permitted to access the route,
     * or "any" to allow any authenticated user.
     * @returns {Function} An Express middleware function
     * that checks authentication and role permissions.
     */
    static restrict(allowedRoles) {
         
          // Return middleware that checks the current user
        return function (req, res, next) {
            
            // Block the request if the user is not authenticated
            if (!req.authenticatedUser) {
                return res.status(401).json({
                    message: "not authenticated",
                    errors: [
                        {
                            message: "Please authenticate to access the requested resource",
                        },
                    ],
                });
            }
            // Check whether the authenticated user's role is allowed
            if (
                allowedRoles !== "any" &&
                !allowedRoles.includes(req.authenticatedUser.role)
            ) {
                return res.status(403).json({
                    message: "Access not allowed",
                    errors: [
                        {
                            message: "Role does not have access to the requested resource",
                        },
                    ],
                });
            }
            
            next(); // Allow the request to continue if authentication and role checks pass
        };
    }
}