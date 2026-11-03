import express from "express";
import path from "path";
import YAML from "yamljs";
import SwaggerUI from "swagger-ui-express";
import * as ApiValidator from "express-openapi-validator";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { ApiSessionsController } from "./ApiSessionsController.mjs";
import { ApiUserController } from "./ApiUserController.mjs";
import { ApiPostController } from "./ApiPostController.mjs";
import { ApiBookingsController } from "./ApiBookingsController.mjs";

// ========== OPENAPI CONFIGURATION ==========
// Defines API documentation settings and the Authentication-Key security scheme.
const options = {
    failOnErrors: true,

    definition: {
        openapi: "3.0.0",

        info: {
            version: "1.0.0",
            title: "High Street Gym API",
            description:
                "JSON REST API for interacting with the backend of High Street Gym",
        },

        components: {
            securitySchemes: {
                ApiKey: {
                    type: "apiKey",
                    in: "header",

                    // Must match the header used by the authentication controller
                    name: "Authentication-Key",
                },
            },
        },
    },

    // Files Swagger checks for OpenAPI documentation comments
    apis: [
        "./backend/controllers/api/**/*.{js,mjs,yaml}",
        "./backend/components.yaml",
    ],
};

// ========== LOAD OPENAPI SPECIFICATION ==========
// Loads components.yaml containing the documented REST API endpoints.
const specification = YAML.load(
    path.join(import.meta.dirname, "../../components.yaml")
);

console.log("API paths:", Object.keys(specification.paths));
console.log("Activities methods:", Object.keys(specification.paths["/sessions/activities"] || {}));
console.log("Locations methods:", Object.keys(specification.paths["/sessions/locations"] || {}));

console.log(
    "SESSION METHODS:",
    Object.keys(specification.paths["/sessions"] || {})
);


export class ApiController {
    // Main router for all API endpoints
    static routes = express.Router();

    static {
        /**
         * @openapi
         * /api/docs:
         *   get:
         *     summary: View automatically generated API documentation
         *     tags:
         *       - Documentation
         *     responses:
         *       "200":
         *         description: Swagger documentation page
         */

// ========== SWAGGER API DOCUMENTATION ==========
// Displays interactive API documentation at /api/docs.
// Allows API endpoints to be viewed and tested through Swagger UI.
        this.routes.use(
            "/docs",
            SwaggerUI.serve,
            SwaggerUI.setup(specification),
        );

        // ========== API REQUEST VALIDATION ==========
        // Validates incoming API requests against components.yaml.
        // Response validation is currently disabled.
        this.routes.use(
            ApiValidator.middleware({
                apiSpec: specification,
                validateRequests: true,

                // Leave false while your response documentation is unfinished
                validateResponses: false,
            }),
        );

        // ========== API AUTHENTICATION ==========
        // Applies authentication middleware and registers login/logout routes.
        this.routes.use(ApiAuthenticationController.middleware);
        this.routes.use(ApiAuthenticationController.routes);

        // ========== API ROUTING AND SEPARATION OF CONCERNS ==========
        // Connects sessions, users, posts and bookings to separate controllers.
        // Keeps endpoint logic organised into individual modules.
        this.routes.use("/sessions", ApiSessionsController.routes);
        this.routes.use("/users", ApiUserController.routes);
        this.routes.use("/posts", ApiPostController.routes);
        this.routes.use("/bookings", ApiBookingsController.routes);

        // ========== API ERROR HANDLING ==========
        // Catches API errors and returns JSON responses.
        // Uses the error's HTTP status code or 500 when no status is provided.
        this.routes.use((err, req, res, next) => {
            console.error(err);

            return res.status(err.status || 500).json({
                status: err.status,
                message: err.message,
                errors: err.errors,
            });
        });
    }
}