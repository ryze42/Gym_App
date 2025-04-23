import express from "express"
import { ActivityModel } from "../models/ActivityModel.mjs"
import validator from "validator"

export class ActivityController {
    /**
     * router for activity routes.
     * @type {express.Router}
     */
    static routes = express.Router()

    static {
        this.routes.get("/", this.viewActivityManagement)
        this.routes.get("/:id", this.viewActivityManagement)

        this.routes.post("/", this.handleActivityManagement)
        this.routes.post("/:id", this.handleActivityManagement)
    }
    
    /**
     * Renders the blog post management page.
     * Only accessible by admins. 
     * @type {express.RequestHandler}
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static viewActivityManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }
    
        const selectedActivityId = req.params.id;
    
        ActivityModel.getAll()
            .then(activities => {
                const selectedActivity = activities.find(
                    activities => activities.id == selectedActivityId
                ) ?? new ActivityModel(null, "", "");
    
                res.render("crud_activities.ejs", {
                    activities,
                    selectedActivity,
                    role: "admin",
                    authenticatedUser: req.authenticatedUser
                });
            })
            .catch(error => {
                console.log(error);
                res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "An error occurred while fetching activities."
                });
            });
    }    

    /**
     * Handles the creation, updating, and deletion of activities.
     * Runs through validation and sanitisation before sending form data to database. 
     * @type {express.RequestHandler}
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleActivityManagement(req, res) {
        const selectedActivityId = req.params.id || req.body.id;
        const formData = req.body;
        const action = formData.action;
    
        if (action === "create" || action === "update") {
            if (!formData.name || !/^[a-zA-Z0-9\s\.,!?;:()\-'\"]{3,100}$/.test(formData.name)) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid activity name between 3 and 100 characters, containing only alphanumeric characters and common punctuation."
                });
            }
    
            if (!formData.duration || isNaN(formData.duration) || Number(formData.duration) <= 0) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid activity duration (a positive number)."
                });
            }
    
            formData.name = validator.escape(formData.name);
            formData.duration = Number(formData.duration);
        }
    
        const activity = new ActivityModel(
            selectedActivityId,
            formData.name,
            formData.duration
        );
    
        if (action === "create") {
            ActivityModel.create(activity)
                .then(result => {
                    res.redirect("/activity");
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The activity could not be created.",
                    });
                    console.error(error);
                });
        } else if (action === "update") {
            ActivityModel.update(activity)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/activity");
                    } else {
                        res.render("status.ejs", {
                            status: "Activity Update Failed",
                            message: "The activity could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The activity could not be updated.",
                    });
                    console.error(error);
                });
        } else if (action === "delete") {
            ActivityModel.softDelete(selectedActivityId)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/activity");
                    } else {
                        res.render("status.ejs", {
                            status: "Activity Deletion Failed",
                            message: "The activity could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The activity could not be deleted.",
                    });
                    console.error(error);
                });
        } else {
            res.render("status.ejs", {
                status: "Invalid Action",
                message: "The form doesn't support this action.",
            });
        }
    }
    
}
