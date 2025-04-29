import express from "express"
import bcrypt from "bcryptjs"
import { UserModel } from "../../models/UserModel.mjs"
import validator from "validator"

export class APIUserController {
    /**
     * router for user management routes.
     * @type {express.Router}
     */
    static routes = express.Router()

    static {
        this.routes.get("/", this.viewUserManagement)
        this.routes.get("/:id", this.viewUserManagement)

        this.routes.post("/", this.handleUserManagement)
        this.routes.post("/:id",this.handleUserManagement)
    }

    /**
     * Renders the user management page.
     * Only accessible by admins.
     * @param {express.Request} req
     * @param {express.Response} res 
     */
    static viewUserManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }
    
        const selectedUserId = req.params.id;
    
        UserModel.getAll()
            .then(users => {
                const selectedUser = users.find(
                    user => user.id == selectedUserId
                ) ?? new UserModel(null, "", "", "", "", "");
    
                res.render("crud_users.ejs", {
                    users,
                    selectedUser,
                    role: "admin",
                    authenticatedUser: req.authenticatedUser
                });
            })
            .catch(error => {
                console.log(error);
                res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "An error occurred while fetching users."
                });
            });
    }
    

    /**
     * Handles session creation, updating, and deletion.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async handleUserManagement(req, res) {
        const selectedUserId = req.params.id || req.body.id;
        const formData = req.body;
        const action = formData.action;
        const saltRounds = 10;
    
        try {
            let hashedPassword = null;

            if (action === "create") {
                if (!formData["password"] || formData["password"].trim() === "") {
                    return res.status(400).render("status.ejs", {
                        status: "Invalid input provided.",
                        message: "Password is required for creating a new user."
                    });
                }
            }
            
            if (formData["password"] && formData["password"].trim() !== "") {
                hashedPassword = await bcrypt.hash(formData["password"], saltRounds);
            }
            
            if (action === "create" || action === "update") {
                if (!formData.first_name || !/^[a-zA-Z\s'-]{2,100}$/.test(formData.first_name.trim())) {
                    return res.status(400).render("status.ejs", {
                        status: "Invalid input provided.",
                        message: "Please enter a valid first name (2-100 characters, letters, spaces, hyphens, and apostrophes only)."
                    });
                }
                
                if (!formData.last_name || !/^[a-zA-Z\s'-]{2,100}$/.test(formData.last_name.trim())) {
                    return res.status(400).render("status.ejs", {
                        status: "Invalid input provided.",
                        message: "Please enter a valid last name (2-100 characters, letters, spaces, hyphens, and apostrophes only)."
                    });
                }                
    
                if (!formData.email || !validator.isEmail(formData.email.trim())) {
                    return res.status(400).render("status.ejs", {
                        status: "Invalid input provided.",
                        message: "Please enter a valid email address."
                    });
                }
    
                formData.first_name = validator.escape(formData.first_name.trim());
                formData.last_name = validator.escape(formData.last_name.trim());
                formData.email = validator.normalizeEmail(formData.email.trim());
            }
    
            const user = new UserModel(
                selectedUserId,
                formData["first_name"],
                formData["last_name"],
                formData["role"],
                formData["email"],
                hashedPassword
            );
    
            if (action === "create") {
                UserModel.create(user)
                    .then(result => {
                        res.redirect("/user");
                    })
                    .catch(error => {
                        res.render("status.ejs", {
                            status: "Database Error",
                            message: "The user could not be created.",
                        });
                        console.error(error);
                    });
            } else if (action === "update") {
                UserModel.update(user)
                    .then(result => {
                        if (result.affectedRows > 0) {
                            res.redirect("/user");
                        } else {
                            res.render("status.ejs", {
                                status: "User Update Failed",
                                message: "The user could not be found.",
                            });
                        }
                    })
                    .catch(error => {
                        res.render("status.ejs", {
                            status: "Database Error",
                            message: "The user could not be updated.",
                        });
                        console.error(error);
                    });
            } else if (action === "delete") {
                UserModel.softDelete(user.id)
                    .then(result => {
                        if (result.affectedRows > 0) {
                            res.redirect("/user");
                        } else {
                            res.render("status.ejs", {
                                status: "User Deletion Failed",
                                message: "The user could not be found.",
                            });
                        }
                    })
                    .catch(error => {
                        res.render("status.ejs", {
                            status: "Database Error",
                            message: "The user could not be deleted.",
                        });
                        console.error(error);
                    });
            } else {
                res.render("status.ejs", {
                    status: "Invalid Action",
                    message: "The form doesn't support this action.",
                });
            }
        } catch (error) {
            res.render("status.ejs", {
                status: "Error",
                message: "There was an error processing the password.",
            });
            console.error(error);
        }
    }
    
}