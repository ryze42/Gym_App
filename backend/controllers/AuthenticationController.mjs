import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";
import validator from "validator";

export class AuthenticationController {
    /**
     * router for authentication middleware.
     * @type {express.Router}
     */
    static middleware = express.Router();

    /**
     * router for authentication routes.
     * @type {express.Router}
     */
    static routes = express.Router();

    static {
        this.middleware.use(session({
            secret: "e88f7cd6-fb3f-4da1-9d76-2aa2b3151dfc",
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        }));
        this.middleware.use(this.#session_authentication);

        this.routes.get("/", this.viewAuthenticate);
        this.routes.post("/", this.handleAuthenticate);
        this.routes.post("/register", this.handleRegister);

        this.routes.delete("/", this.handleDeauthenticate);
        
        this.routes.get("/logout", this.handleDeauthenticate);
    }

    /**
     * Middleware to authenticate session users.
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next 
     * @private
     */
    static async #session_authentication(req, res, next) {
        if (req.session.userId && !req.authenticatedUser) {
            try {
                req.authenticatedUser = await UserModel.getById(req.session.userId);
            } catch (error) {
                console.error("Error loading authenticated user:", error);
            }
        }
        next();
    }

    /**
     * Renders the login page.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static viewAuthenticate(req, res) {
        const userRole = req.authenticatedUser ? req.authenticatedUser.role : null;

        res.render("login.ejs", { authenticatedUser: req.authenticatedUser, role: userRole });
    }

    /**
     * Handles login authentication and redirects to session timetable.
     * Runs through validation and sanitisation on the login form before logging in.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async handleAuthenticate(req, res) {
        let { email, password } = req.body;
    
        if (!email || !password) {
            return res.status(400).render("status.ejs", {
                status: "Authentication Failed",
                message: "Email and password are required."
            });
        }
    
        email = validator.normalizeEmail(email.trim());
        password = password.trim();
    
        if (!validator.isEmail(email)) {
            return res.status(400).render("status.ejs", {
                status: "Authentication Failed",
                message: "Please enter a valid email address."
            });
        }
    
        try {
            const user = await UserModel.getByEmail(email);
    
            if (!user) {
                return res.status(400).render("status.ejs", {
                    status: "Authentication Failed",
                    message: "Invalid credentials."
                });
            }
    
            const isCorrectPassword = await bcrypt.compare(password, user.password);
    
            if (!isCorrectPassword) {
                return res.status(400).render("status.ejs", {
                    status: "Authentication Failed",
                    message: "Invalid credentials."
                });
            }
    
            req.session.userId = user.id;
    
            return res.redirect("/session_timetable");
        } catch (error) {
            console.error("Error during authentication:", error);
            return res.status(500).render("status.ejs", {
                status: "Database Error",
                message: "Authentication failed due to a server issue."
            });
        }
    }

    /**
     * Handles user registration and account creation.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async handleRegister(req, res) {
        const { first_name, last_name, email, password, role } = req.body;
        
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).render("status.ejs", {
                status: "Registration Failed",
                message: "All fields are required."
            });
        }
        
        if (!/^[a-zA-Z\s'-]{2,100}$/.test(first_name.trim())) {
            return res.status(400).render("status.ejs", {
                status: "Registration Failed",
                message: "Please enter a valid first name (2-100 characters, letters, spaces, hyphens, and apostrophes only)."
            });
        }
    
        if (!/^[a-zA-Z\s'-]{2,100}$/.test(last_name.trim())) {
            return res.status(400).render("status.ejs", {
                status: "Registration Failed",
                message: "Please enter a valid last name (2-100 characters, letters, spaces, hyphens, and apostrophes only)."
            });
        }
    
        if (!validator.isEmail(email.trim())) {
            return res.status(400).render("status.ejs", {
                status: "Registration Failed",
                message: "Please enter a valid email address."
            });
        }
    
        if (password.trim().length < 8) {
            return res.status(400).render("status.ejs", {
                status: "Registration Failed",
                message: "Password must be at least 8 characters long."
            });
        }
        
        try {
            const sanitizedFirstName = validator.escape(first_name.trim());
            const sanitizedLastName  = validator.escape(last_name.trim());
            const normalizedEmail    = validator.normalizeEmail(email.trim());
    
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = {
                first_name: sanitizedFirstName,
                last_name: sanitizedLastName,
                email: normalizedEmail,
                password: hashedPassword,
                role: role || "member" 
            };
    
            await UserModel.create(newUser);
            
            res.redirect("/authenticate");
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).render("status.ejs", {
                status: "Registration Failed",
                message: "There was an error creating your account."
            });
        }
    }
    
    /**
     * Handles logout by clearing the session, adds a small delay before redirecting to login page.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleDeauthenticate(req, res) {
        if (req.authenticatedUser) {
            if (req.session.userId) {
                req.session.destroy((err) => {
                    if (err) {
                        return res.status(500).render("status.ejs", {
                            status: "Error",
                            message: "There was an issue logging out. Please try again."
                        });
                    }

                    setTimeout(() => {
                        res.status(200).redirect("/authenticate"); 
                    }, 200); 
                });
            }
        } else {
            res.status(401).render("status.ejs", {
                status: "Unauthenticated",
                message: "Please login to access the requested resource."
            });
        }
    }

    /**
     * Middleware to restrict access to specific roles.
     * @param {string[]} allowedRoles - Array of allowed user roles.
     * @returns {express.RequestHandler} Middleware 
     */
    static restrict(allowedRoles) {
        return function (req, res, next) {
            if (req.authenticatedUser) {
                if (allowedRoles.includes(req.authenticatedUser.role)) {
                    next();
                } else {
                    res.status(403).render("status.ejs", {
                        status: "Access Forbidden",
                        message: "You do not have access to this resource."
                    });
                }
            } else {
                res.status(401).render("status.ejs", {
                    status: "Unauthenticated",
                    message: "Please login to access the requested resource."
                });
            }
        };
    }
}
