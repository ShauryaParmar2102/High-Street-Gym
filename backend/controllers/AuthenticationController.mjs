import express from "express";
import session from "express-session";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

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
           // API SECURITY: Load the authenticated user from the session
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

        // Display the login page
        static viewAuthenticate(req, res) {
            // Render the login EJS and send query messages to the view
            return res.render("login.ejs", {
                // Used to show a message after successful registration
                registered: req.query.registered,
                // Used to show a message after logout
                logout: req.query.logout,
            });
        }

        // Display the registration page
        static viewRegister(req, res) {
             // Render the registration EJS page
            return res.render("register.ejs");
        }

         // Display the dashboard for the logged-in user
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
            // REGISTER VALIDATION - Check name, email and password requirements
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
            // ==================== USER LOGIN ====================
            // Handles user login by checking the email and password
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
            // Log the current user out of the application
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

            // Restrict a route so only specified user roles can access it
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