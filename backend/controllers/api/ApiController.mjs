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

// Swagger and OpenAPI configuration
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

// Generate the OpenAPI specification
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

        // Display Swagger API documentation
        this.routes.use(
            "/docs",
            SwaggerUI.serve,
            SwaggerUI.setup(specification),
        );

        // Validate API requests against the OpenAPI specification
        this.routes.use(
            ApiValidator.middleware({
                apiSpec: specification,
                validateRequests: true,

                // Leave false while your response documentation is unfinished
                validateResponses: false,
            }),
        );

        // Authentication middleware and login/logout routes
        this.routes.use(ApiAuthenticationController.middleware);
        this.routes.use(ApiAuthenticationController.routes);

        // Mount API resource controllers
        this.routes.use("/sessions", ApiSessionsController.routes);
        this.routes.use("/users", ApiUserController.routes);
        this.routes.use("/posts", ApiPostController.routes);
        this.routes.use("/bookings", ApiBookingsController.routes);

        // Handle OpenAPI validation and other API errors as JSON
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