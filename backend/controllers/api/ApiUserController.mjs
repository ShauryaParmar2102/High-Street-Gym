import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.mjs";

export class ApiUserController {
    static routes = express.Router(); // Create an Express router for all user API routes

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
            //Create a new member
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
            //Return the logged in user's information
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
            //Get a specific user by ID
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

    // Keep existing information and update the allowed fields
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