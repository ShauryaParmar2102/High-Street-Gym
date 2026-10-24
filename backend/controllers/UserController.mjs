import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserModel } from "../models/UserModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";
import { PostModel } from "../models/PostModel.mjs";
import { SessionModel } from "../models/SessionModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

export class UserController {
    static routes = express.Router();

    static {
        //View all users with optional search and role filter GET /user
        this.routes.get(
            "/",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.viewUserManagement,
        );
        //View users + select a specific user by ID
        this.routes.get(
            "/:id",
            AuthenticationController.restrict(["administrator", "trainer"]), // Allow access only to administrators and trainers
            this.viewUserManagement,
        );
        
        //POST /user
        //Create user
        this.routes.post(
            "/",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.handleUserManagement,
        );

        //POST /user/:id - Update or delete user by ID
        this.routes.post(
            "/:id",
            AuthenticationController.restrict(["administrator"]), // Allow access only to administrators
            this.handleUserManagement,
        );
    }

    //View user management
    static async viewUserManagement(req, res) {
        const selectedUserId = req.params.id;
        const search = req.query.search || "";
        const roleFilter = req.query.role || "";

        try {
            let users = await UserModel.getAll();

             if (search) {
        users = users.filter(
            (u) => 
                (u.firstName + " " + u.lastName)
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())

            );
        }

        //Role Filter
        if (roleFilter) {
            users = users.filter((u) => u.role === roleFilter);
        }

        //Selected user
        const selectedUser = 
            users.find((u) => u.id == selectedUserId) ||
            new UserModel(null, "", "", "", "", "");

        return res.render("user_management.ejs", {
            users,
            selectedUser,
            authenticatedUser: req.user,
            search,
            roleFilter,
        });
    } catch(error) {
        console.error(error);
        return res.status(500).render("status.ejs", {
            status: "Error",
            message: "Failed to load users",
        });
       }
    }

    // ==================== USER CREATION VALIDATION ====================
    // Validate the user's name, email and password before creating the account
    static async handleUserManagement(req, res) {
        const selectedUserId = req.params.id;
        const formData = req.body;
        const action = formData.action;

        try {
            
            // ==================== USER ACCOUNT CREATION ====================
            //Create User
            if(action === "create") {
                const {firstName, lastName, role, email, password} = formData;

                // ==================== USER INPUT VALIDATION ====================

                //Name Validation - Must start with uppercase letter
                const nameRegex = /^([A-Z][a-z]+)( [A-Z][a-z]+)*$/;

                // Checks that each name starts with a capital letter and the remaining letters are lowercase
                if (!nameRegex.test(firstName) || !nameRegex.test(lastName)){
                    return res.status(400).render("status.ejs", {
                        status: "Error",
                        message: 
                            "Invalid name format - first name and last name must be uppercase",
                    });
                }

                //nameRegex = defines the required format
                //.test() = checks whether the name follows that format.

                // Validates that the email follows a basic format such as user@gmail.com
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if(!emailRegex.test(email)) {
                    return res.status(400).render("status.ejs", {
                        status: "Error",
                        message: "Please enter a valid email address",
                    });
                }

                // Password must contain at least 6 characters
                if (!password || password.length < 6) {
                    return res.status(400).render("status.ejs", {
                        status: "Error",
                        message: "Password must be at least 6 characters",
                    });
                }

                // API SECURITY: Hash password before saving it using bcrypt with 10 salt rounds
                const hashedPassword = await bcrypt.hash(password, 10);
                const authenticationKey = crypto.randomUUID(); // Generate a unique authentication key for the user

                // Create a new user using the hashed password
                const user = new UserModel(
                null, // ID is generated automatically by the database
                firstName, // Store the user's first name
                lastName, // Store the user's last name
                email, // Store the user's email address
                hashedPassword, // Store the hashed password
                role, // Store the user's role
                null, // Creation date is not supplied when creating the user
                authenticationKey,   // Store the generated authentication key
            );
                // Store the new user's details, including the hashed password, in the database
                await UserModel.create(user);
                return res.redirect("/user");
            }

            // ==================== USER UPDATE ====================
            //Update User
            if(action === "update") {
                const existingUser = await UserModel.getById(selectedUserId); //Get the existing user from the database

                   // If a trainer gets changed to another role, remove bookings connected to their sessions first
                    if (existingUser.role === "trainer" && formData.role !== "trainer") {
                        await BookingModel.deleteByTrainerId(selectedUserId); // Delete bookings linked to the trainer's sessions first
                        await SessionModel.deleteByTrainerId(selectedUserId); // Delete all sessions that belong to the trainer
                    }

                existingUser.firstName = formData.firstName; // Update the user's first name
                existingUser.lastName = formData.lastName; // Update the user's last name
                existingUser.role = formData.role;  // Update the user's role
                existingUser.email = formData.email; // Update the user's email address

                //Only update password if provided
                if(formData.password) {
                    existingUser.passwordHash = await bcrypt.hash(formData.password, 10); // Hash the new password before storing it
                }

                await UserModel.update(existingUser); // Save the updated user details to the database
                return res.redirect("/user"); // Return to the user management page
            }

            // ==================== USER DELETION ====================

            // Delete User
        if (action === "delete") {

            // Check that a user was selected
            if (!selectedUserId) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid User",
                    message: "No user was selected for deletion",
                });
            }

// Delete the selected user's related bookings, sessions and posts before deleting their account

         // Delete bookings connected to the selected user's sessions
        await BookingModel.deleteByTrainerId(selectedUserId);

        // Delete sessions belonging to the selected user
        await SessionModel.deleteByTrainerId(selectedUserId);

        // Delete bookings made by the selected user
        await BookingModel.deleteByMemberId(selectedUserId);

        // Delete posts made by the selected user
        await PostModel.deleteByUserId(selectedUserId);

        // Finally delete the selected user's account
        await UserModel.delete(selectedUserId);

        // Return to the user management page
        return res.redirect("/user");
        }

        return res.status(400).render("status.ejs", {
            status: "Invalid Action",
            message: "Unsupported action",
        });
    } catch (error) {
    console.error(error);

    // Prevent deletion of a user while they have an active booking.
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).render("status.ejs", {
            status: "Cannot Delete User",
            message: "This user has related posts, bookings, or sessions and cannot be deleted yet.",
        });
    }

    // Handle any other database error
    return res.status(500).render("status.ejs", {
        status: "Database Error",
        message: "Operation Failed",
    });
}
}

}
