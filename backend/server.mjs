import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors"; // Allows the React frontend to access the backend

import { AuthenticationController } from "./controllers/AuthenticationController.mjs";
import { ActivityController } from "./controllers/ActivityController.mjs";
import { BookingController } from "./controllers/BookingController.mjs";
import { SessionController } from "./controllers/SessionController.mjs";
import { PostController } from "./controllers/PostController.mjs";
import { UserController } from "./controllers/UserController.mjs";
import { LocationController } from "./controllers/LocationController.mjs";
import { ApiController } from "./controllers/api/ApiController.mjs";


const app = express();
const port = 8080;


// ========== CORS CONFIGURATION ==========
// Allows the React frontend on port 5173 to access the backend on port 8080.
// Supports GET, POST, PUT, PATCH, DELETE and OPTIONS requests.
// Allows the Authentication-Key header for authenticated API requests.
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authentication-Key"]
}));

// Load the Swagger API documentation from components.yaml
// This file defines the API endpoints, request formats, and responses.
const swaggerDocument = YAML.load(
    path.join(import.meta.dirname, "components.yaml")
);

// Swagger UI
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

console.log("Swagger version:", swaggerDocument.openapi);

console.log(
    "SESSION METHODS:",
    Object.keys(swaggerDocument.paths?.["/sessions/{id}"] || {})
);

// ========== EJS VIEW ENGINE ==========
// Configures EJS templates for rendering backend web pages.
app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

// ========== REQUEST BODY MIDDLEWARE ==========
// Parses incoming JSON and URL-encoded form data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ========== AUTHENTICATION MIDDLEWARE ==========
// Runs the backend authentication middleware before the routes below.
app.use(AuthenticationController.middleware);

// Mount the authentication routes
app.use("/authenticate", AuthenticationController.routes);

// ========== API ROUTING AND SEPARATION OF CONCERNS ==========
// Mounts the REST API routes under /api.
// Individual controllers handle their own endpoint logic.
app.use("/api", ApiController.routes);

app.use("/booking", BookingController.routes); // Booking routes
 
app.use("/session", SessionController.routes); // Send gym session requests to the Session Controller
 
app.use("/post", PostController.routes); // Send community blog requests to the Post Controller

app.use("/user", UserController.routes); // Send user management requests to the User Controller

app.use("/activity", ActivityController.routes); // Send activity management requests to the Activity Controller

app.use("/location", LocationController.routes); // Send location management requests to the Location Controller

// Redirect the homepage to the login page
app.get("/", (req, res) => {
    return res.redirect("/authenticate");
});

// Serve CSS, images and client-side JavaScript
app.use(express.static(path.join(import.meta.dirname, "public")));

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        customCss: ".swagger-ui .topbar { display: none }"
    })
);

// ========== SERVER STARTUP ==========
// Starts the Express backend server on port 8080.
app.listen(port, () => {
    console.log(`Backend started on http://localhost:${port}`);
});