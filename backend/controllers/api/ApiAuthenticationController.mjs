import express from "express";
import { UserModel } from "../../models/UserModel.mjs"; // Import the User model to retrieve users from the database
import bcrypt from "bcryptjs"; // Used to securely hash and compare passwords
import crypto from "crypto"; // Used to generate secure random authentication keys
 
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

    // Middleware that authenticates API requests using an authentication key
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

    // ==================== API USER LOGIN AUTHENTICATION ====================
    // Handle user authentication and login requests
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
            // Handle user logout
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

    // Restrict access to routes based on authentication and user role
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