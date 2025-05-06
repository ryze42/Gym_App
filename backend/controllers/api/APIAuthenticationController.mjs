import express from "express";
import { UserModel } from "../../models/UserModel.mjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class APIAuthenticationController {
    static middleware = express.Router();
    static routes = express.Router();
    
    static {
        this.middleware.use(this.#APIAuthenticationProvider);
        this.routes.post("/authenticate", this.handleAuthenticate);
        this.routes.post("/authenticate/register", this.handleRegister);
        this.routes.delete("/authenticate", this.handleAuthenticate);
    }

    /**
     * This middleware checks for the API key header and
     * loads the user into req.authenticatedUser if valid.
     * @private
     * @type {express.RequestHandler}
     */
    static async #APIAuthenticationProvider(req, res, next) {
        const authenticationKey = req.headers["x-auth-key"];
        if (authenticationKey) {
            try {
                req.authenticatedUser = await UserModel.getByAuthenticationKey(authenticationKey);
            } catch (error) {
                if (error === "not found") {
                    return res.status(401).json({ message: "Failed to authenticate - key not found" });
                }
                return res.status(500).json({ message: "Failed to authenticate - database error" });
            }
        }
        next();
    }

    /**
     * @type {express.RequestHandler}
     * @openapi
     * /api/authenticate:
     *   post:
     *     summary: "Authenticate with email and password"
     *     tags: [Authentication]
     *     requestBody:
     *       $ref: "#/components/requestBodies/UserCredentials"
     *     responses:
     *       '200':
     *         $ref: "#/components/responses/LoginSuccessful"
     *       '400':
     *         $ref: "#/components/responses/Error"
     *       '500':
     *         $ref: "#/components/responses/Error"
     *       default:
     *         $ref: "#/components/responses/Error"
     *   delete:
     *     summary: "Deauthenticate"
     *     tags: [Authentication]
     *     security:
     *       - ApiKey: []
     *     responses:
     *       '200':
     *         $ref: "#/components/responses/Updated"
     *       '401':
     *         $ref: "#/components/responses/Error"
     *       '500':
     *         $ref: "#/components/responses/Error"
     *       default:
     *         $ref: "#/components/responses/Error"
     */
    static async handleAuthenticate(req, res) {
        if (req.method === "POST") {
            try {
                const { email, password } = req.body;
                const user = await UserModel.getByEmail(email);
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                const authenticationKey = crypto.randomUUID();
                user.authentication_key = authenticationKey;
                await UserModel.update(user);
                return res.status(200).json({ key: authenticationKey });
            } catch (error) {
                if (error === "not found") {
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                console.error(error);
                return res.status(500).json({ message: "Failed to authenticate user" });
            }
        } else if (req.method === "DELETE") {
            if (!req.authenticatedUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            try {
                const user = await UserModel.getByAuthenticationKey(req.authenticatedUser.authenticationKey);
                user.authenticationKey = null;
                await UserModel.update(user);
                return res.status(200).json({ message: "Deauthentication successful" });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Failed to deauthenticate user" });
            }
        }
    }

    /**
     * Handle user registration
     * @type {express.RequestHandler}
     * @openapi
     * /api/authenticate/register:
     *   post:
     *     summary: "Register a new user"
     *     tags: [Authentication]
     *     requestBody:
     *       $ref: "#/components/requestBodies/User"
     *     responses:
     *       '201':
     *         $ref: "#/components/responses/Created"
     *       '400':
     *         $ref: "#/components/responses/Error"
     *       '500':
     *         $ref: "#/components/responses/Error"
     *       default:
     *         $ref: "#/components/responses/Error"
     */
    static async handleRegister(req, res) {
        try {
            const { first_name, last_name, role, email, password } = req.body;

            if (!first_name || !last_name || !email || !password || !role) {
                return res.status(400).json({ message: "Missing required registration fields" });
            }
            const hashed = await bcrypt.hash(password, 10);
            const newUser = { first_name, last_name, role, email, password: hashed };
            const result = await UserModel.create(newUser);
            return res.status(201).json({ id: result.insertId, message: "Item created" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to register user" });
        }
    }

    /**
     * @param {Array<"admin"|"trainer"|"member">|"any"} allowedRoles
     * @returns {express.RequestHandler}
     */
    static restrict(allowedRoles) {
        return (req, res, next) => {
            if (!req.authenticatedUser) {
                return res.status(401).json({ message: "Not authenticated", errors: ["Please authenticate"] });
            }
            if (allowedRoles !== "any" && !allowedRoles.includes(req.authenticatedUser.role)) {
                return res.status(403).json({ message: "Access forbidden", errors: ["Insufficient role"] });
            }
            next();
        };
    }
}
