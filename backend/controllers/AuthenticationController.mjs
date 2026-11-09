import express from "express";
import session from "express-session";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

/**
 * Handles user authentication and authorisation
 * for the High Street Gym web application.
 *
 * Provides routes for user login, registration,
 * logout and displaying the dashboard.
 *
 * Uses Express sessions to maintain logged-in users
 * and bcrypt to securely hash and verify passwords.
 *
 * Also provides middleware to authenticate users
 * and restrict access based on their assigned roles.
 */
export class AuthenticationController {
    static middleware = express.Router();
    static routes = express.Router();
    
    static {
            // API SECURITY: Configure session management for logged-in users
        this.middleware.use(
            session({
                secret: "4f2b7a9d-0d45-4e78-8e32-1d5a9f8c3b6e", // API SECURITY: Secret key used to sign the session cookie and help prevent tampering
                resave: false,  // Do not save the session again if nothing has changed
                saveUninitialized: false,   // Do not create a session until something is stored in it
                cookie: {
                    // False allows the cookie to work on localhost without HTTPS
                    secure: false,
                },
            }),
        );
            //Load authenticated user from session 
        this.middleware.use(this.sessionAuth.bind(this));

// ==================== LOGIN ROUTES ====================

        this.routes.get("/", this.viewAuthenticate);
         // Process the submitted login form
        this.routes.post("/", this.handleAuthenticate);

// ==================== REGISTRATION ====================

        // Display registration page
        this.routes.get("/register", this.viewRegister);
        
         // Process the submitted registration form
        this.routes.post("/register", this.handleRegister);

// ==================== LOGOUT ====================

    // Log out the user using a GET request
    this.routes.get("/logout", this.handleDeauthenticate);

    // Log out the user using a POST request
    this.routes.post("/logout", this.handleDeauthenticate);

    // ==================== DASHBOARD ROUTES ====================

    // Display dashboard for administrators, trainers and members
    this.routes.get(
        "/dashboard",
         this.restrict(["administrator", "trainer", "member"]), // Allow access only to administrators, trainers and members
         this.viewDashboard,
        );
    }
            /**
             * Authenticates users using their existing Express session.
             *
             * Checks whether the session contains a user ID
             * and retrieves the matching user from MySQL.
             *
             * Stores the authenticated user in the request object
             * or sets the user to null if authentication fails.
             *
             * Continues to the next middleware or route.
             *
             * @static
             * @async
             * @param {Object} req - The Express request object containing session information.
             * @param {Object} res - The Express response object.
             * @param {Function} next - The callback used to continue to the next middleware.
             * @returns {Promise<void>} A promise that resolves when authentication processing finishes.
             */
            static async sessionAuth(req, res, next) {
             try {
            // API SECURITY: Check whether the session contains a logged-in user's ID
            if (req.session.userId) {

                console.log("SESSION USER ID:", req.session.userId);        
                const user = await UserModel.getById(req.session.userId); // API SECURITY: Load the user linked to the session
                console.log("LOADED USER:", user);

                req.user = user || null; // Store the user in req.user, or null if the user was not found
            } else {
                req.user = null; // No user ID in the session means nobody is logged in
            } 
        } catch (error) {
        console.log("SESSION AUTH ERROR:", error);
        req.user = null; // API SECURITY: Treat failed authentication as unauthenticated
        }

        next();  // Continue to the next middleware or route
        }

        /**
         * Displays the user login page.
         *
         * Renders the login EJS template and passes
         * registration and logout messages from the URL query.
         *
         * @static
         * @param {Object} req - The Express request object containing query parameters.
         * @param {Object} res - The Express response object used to render the login page.
         * @returns {Object} The Express response rendering the login page.
         */
        static viewAuthenticate(req, res) {
            // Render the login EJS and send query messages to the view
            return res.render("login.ejs", {
                // Used to show a message after successful registration
                registered: req.query.registered,
                // Used to show a message after logout
                logout: req.query.logout,
            });
        }

        /**
         * Displays the member registration page.
         *
         * Renders the registration EJS template
         * so new members can create an account.
         *
         * @static
         * @param {Object} req - The Express request object.
         * @param {Object} res - The Express response object used to render the registration page.
         * @returns {Object} The Express response rendering the registration page.
         */
        static viewRegister(req, res) {
             // Render the registration EJS page
            return res.render("register.ejs");
        }

        /**
         * Displays the dashboard for the authenticated user.
         *
         * Checks whether a user is logged in and redirects
         * unauthenticated users to the login page.
         *
         * Renders the dashboard EJS template and passes
         * the authenticated user's information to the view.
         *
         * @static
         * @param {Object} req - The Express request object containing the authenticated user.
         * @param {Object} res - The Express response object used to render or redirect.
         * @returns {Object} The Express response containing the dashboard or redirect.
         */
        static viewDashboard(req, res){

            //If there is no autenticated user, send them to the login page
            if (!req.user) {
                return res.redirect("/authenticate/");
            }
                // Render the dashboard and provide the logged-in user's details
            return res.render("dashboard.ejs", {
                user: req.user,
            });
        }
        /**
         * Processes member registration form submissions.
         *
         * Validates the user's first name, last name,
         * email address and password.
         *
         * Checks whether the email is already registered
         * and uses bcrypt to hash the password.
         *
         * Creates a new member account in MySQL
         * and generates a unique authentication key.
         *
         * Redirects to the login page on successful registration.
         * Displays validation or server errors when registration fails.
         *
         * @static
         * @async
         * @param {Object} req - The Express request object containing registration form data.
         * @param {Object} res - The Express response object used for redirects and error pages.
         * @returns {Promise<Object>} A promise resolving to the registration response.
         */
        static async handleRegister(req, res) {
            try {
                // Get the registration form values from the request body
                const { firstName, lastName, email, password, role } = req.body;

                const errors = []; // Store any validation errors

                 // API SECURITY: Validate registration input before creating the user
                if (!firstName || firstName.trim().length < 2) {
                    errors.push("First Name must be at least 2 characters.")
                }
                     // Make sure the last name exists and contains at least 2 characters
                if(!lastName || lastName.trim().length < 2) {
                    errors.push("Last name must be at least 2 characters.")
                }
                // Regular expression used to check the basic format of an email address
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                // API SECURITY: Validate the email format
                if(!email || !emailRegex.test(email)) {
                    errors.push("invalid email address")
                }
                // API SECURITY: Require a minimum password length
                if(!password || password.length < 8) {
                    errors.push("Password must be 8 characters");
                }
                    // Display the validation errors on the status page
                if(errors.length > 0) {
                    return res.status(400).render("status.ejs", {
                        status: "Validation Error",
                        message: errors.join("<br>"),
                        returnUrl: "/register",
                    })
                }
                // API SECURITY: Check whether the email is already registered
                const existingUser = await UserModel.getByEmail(email);  

                // Stop registration if the email is already registered
                if(existingUser) {
                    return res.status(400).render("status.ejs", {
                        status: "error",
                        message: "email already exists",
                        returnUrl: "/register",
                    });
                }
                // API SECURITY: Hash the password with bcrypt using 10 salt rounds
                const hashedPassword = await bcrypt.hash(password, 10);

                const authenticationKey = crypto.randomUUID(); // Generate a unique authentication key for the new user

                const newUser = new UserModel(
                  null, // ID will be generated by MySQL
                  firstName,
                  lastName,
                  email,
                 hashedPassword,
                 "member",
                 null,  // createdAt - database will generate it
                 authenticationKey, // Authentication key assigned to the user
                );

                await UserModel.create(newUser);  // Insert new user into the database

                return res.redirect("/authenticate/?registered=success");  // Redirect to login and indicate that registration succeeded
            } catch (error) {
                console.error("REGISTER ERROR:", error);

                // Display an error page if registration fails
                return res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "registration failed",
                    returnUrl: "/register",
                });
            }
        }
        
        /**
         * Processes user login requests.
         *
         * Retrieves the email and password from the login form
         * and checks that both fields have been provided.
         *
         * Finds the matching user in MySQL and uses bcrypt
         * to compare the password with the stored hash.
         *
         * Stores the authenticated user's ID in the session
         * and redirects to the dashboard after successful login.
         *
         * Displays an error page for invalid credentials,
         * session errors or database failures.
         *
         * @static
         * @async
         * @param {Object} req - The Express request object containing login credentials.
         * @param {Object} res - The Express response object used for redirects and error pages.
         * @returns {Promise<Object|undefined>} A promise resolving to the login response
         * or undefined when the session-save callback handles the response.
         */
        static async handleAuthenticate(req, res) {
            const {email, password} = req.body; // Get the email and password entered by the user in the login form

                // Check that both fields were provided
            if(!email || !password) {
                return res.status(400).render("status.ejs", {
                    status: "Error",
                    message: "Email and password are required",
                    returnUrl: "/authenticate",
                });
            }

            try {
                const user = await UserModel.getByEmail(email); // Find the user in the database using their email

                console.log("USER FROM DB:", user); 

                    // Stop login if no matching user exists
                if(!user){
                    return res.status(400).render("status.ejs", {
                        status: "Login failed",
                        message: "Invalid Email or password",
                        returnUrl: "/authenticate",
                    });
                }

                // Make sure the user has a password hash stored in the database
                  if(!user.passwordHash){

                    return res.status(400).render("status.ejs", {
                        status: "Login failed",
                        message: "Invalid Email or password",
                        returnUrl: "/authenticate",
                    });
                }
                    // API SECURITY: Compare the entered password with the stored bcrypt hash
                    const isCorrectPassword = await bcrypt.compare(
                       password,
                      user.passwordHash
                        );

                    console.log("PASSWORD CORRECT:", isCorrectPassword);

                // Stop login if the password is incorrect
                if (!isCorrectPassword) {
                    return res.status(400).render("status.ejs", {
                        status: "login failed",
                        message: "Invalid email or password",
                        returnUrl: "/authenticate",
                    });
                }

                // API SECURITY: Store the authenticated user's ID in the session and remembers which user successfully logged in
                req.session.userId = user.id;  

                req.session.save((err) => {
                    if (err) {
                        console.error("SESSION SAVE ERROR: ", err); // Save the session before redirecting

                        return res.status(500).render("status.ejs", {
                            status: "Error",
                            message: "Session error",
                            returnUrl: "/authenticate",
                        });
                    }
                    return res.redirect("/authenticate/dashboard"); // Redirect the logged-in user to the dashboard  
                });

            } catch (error) {
                console.error("LOGIN ERROR:", error); // Handle unexpected database or authentication errors

                return res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "Authentication failed",
                    returnUrl: "/authenticate",
                });
            }
        }
        
        /**
         * Logs the currently authenticated user out of the application.
         *
         * Checks whether a user session exists and destroys
         * the session to remove the user's login information.
         *
         * Redirects to the login page after successful logout.
         * Displays an error page if the session cannot be destroyed.
         *
         * @static
         * @param {Object} req - The Express request object containing session information.
         * @param {Object} res - The Express response object used for redirects and error pages.
         * @returns {Object|undefined} The redirect response when no session exists,
         * or undefined when the session-destroy callback handles the response.
         */
        static handleDeauthenticate(req,res) {

                    // If there is no logged-in user, return to the login page
            if (!req.session.userId) {
                return res.redirect("/authenticate");
            }
                  // Destroy the user's session to log them out
            req.session.destroy((err) => {

                // Check whether destroying the session failed
                if(err) {
                    console.error("LOGOUT ERROR:", err);
                         // Display an error page if logout fails
                    return res.status(500).render("status.ejs", {
                        status: "Error",
                        message: "Logout Failed",
                    });
                }
                // Return to the login page and show a successful logout message
            return res.redirect("/authenticate/?logout=success");
            });
        }

    // ==================== ROLE-BASED ACCESS CONTROL ====================

        /**
         * Restricts access to routes based on authenticated user roles.
         *
         * Returns middleware that checks whether a user
         * is logged in and has one of the permitted roles.
         *
         * Converts role names to lowercase for comparison.
         *
         * Returns HTTP 401 if the user is not authenticated
         * and HTTP 403 if the user's role is not authorised.
         *
         * Allows the request to continue when access is permitted.
         *
         * @static
         * @param {string[]} roles - An array of user roles allowed to access the route.
         * @returns {Function} An Express middleware function
         * that checks authentication and role permissions.
         */
        static restrict(roles) {
                // Return middleware that runs before the protected route
            return(req, res, next) => {
                const user = req.user;

      console.log("ROLE CHECK:");
      console.log("USER:", user);
      console.log("USER ROLE:", user?.role || "Not logged in");
      console.log("ALLOWED ROLES:", roles);

        // Block access if the user is not logged in
      if(!user) {
        return res.status(401).render("status.ejs", {
            status: "Login Required",
            message: "Please login first",
            returnUrl: "/authenticate", // Send the Go Back button to the login page
        });
      }

      const userRole = user.role.toLowerCase();// Convert the user's role to lowercase for consistent comparison

        // Convert all allowed roles to lowercase
      const allowedRoles = roles.map((role) => role.toLowerCase()); 

       // Check whether the user's role is allowed to access this route
      if(!allowedRoles.includes(userRole)) {

         // Display an access denied page if the role is not allowed
        return res.status(403).render("status.ejs", {
            status: "Access Denied",
            message: "You do not have permission",
        });
      }

    next(); // User is authenticated and authorised, so continue to the route
    
         };
     }
}