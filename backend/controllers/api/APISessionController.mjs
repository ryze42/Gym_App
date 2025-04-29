import express from "express"
import { SessionModel } from "../../models/SessionModel.mjs"
import { SessionTrainerActivityLocationModel } from "../../models/SessionTrainerActivityLocationModel.mjs"
import { ActivityModel } from "../../models/ActivityModel.mjs"
import { LocationModel } from "../../models/LocationModel.mjs"
import { UserModel } from "../../models/UserModel.mjs"
import validator from "validator"

export class APISessionController {
    /**
     * router for session management routes.
     * @type {express.Router}
     */
    static routes = express.Router()

    static {
        this.routes.get("/", this.viewSessionManagement)
        this.routes.get("/:id", this.viewSessionManagement)

        this.routes.post("/", this.handleSessionManagement)
        this.routes.post("/:id",this.handleSessionManagement)
    }
    
    /**
     * Renders the session management page.
     * Only accessible by admins.
     * @param {express.Request} req
     * @param {express.Response} res 
     */
    static viewSessionManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
          return res.status(403).render("status.ejs", {
            status: "Forbidden",
            message: "Access denied :)"
          });
        }
        
        const selectedSessionId = req.params.id || null;
      
        Promise.all([
          SessionTrainerActivityLocationModel.getAll(),
          ActivityModel.getAll(),
          LocationModel.getAll(),
          UserModel.getAll() 
        ])
        .then(([sessions, activities, locations, users]) => {
          const selectedSession = sessions.find(
            item => item.session.id == selectedSessionId
          ) || { session: {} };
          
          const trainers = users.filter(user => user.role === 'trainer');
          
          res.render("crud_sessions.ejs", {
            sessions,
            selectedSession,
            activities,
            locations,
            trainers,
            role: "admin",
            authenticatedUser: req.authenticatedUser
          });
        })
        .catch(error => {
          console.error(error);
          res.status(500).render("status.ejs", {
            status: "Error",
            message: "An error occurred while fetching sessions."
          });
        });
    }
      
    /**
     * Handles session creation, updating, and deletion.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleSessionManagement(req, res) {
        const selectedSessionId = req.params.id;
        const formData = req.body;
        const action = formData.action;

        if (action === "create" || action === "update") {
            if (!formData.activity_id || !/^\d{1,50}$/.test(formData.activity_id.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid Activity ID (1-50 digits only)."
                });
            }

            if (!formData.date || !validator.isDate(formData.date, { format: 'YYYY-MM-DD', strictMode: true })) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid date in the format YYYY-MM-DD."
                });
            }
            formData.start_time = formData.start_time.trim();
            if (!formData.start_time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formData.start_time)) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid start time in 24-hour format (HH:mm)."
                });
            }            

            if (!formData.location_id || !/^\d{1,50}$/.test(formData.location_id.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid Location ID (1-50 digits only)."
                });
            }
            
            if (!formData.trainer_id || !/^\d{1,50}$/.test(formData.trainer_id.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid Trainer ID (1-50 digits only)."
                });
            }
            
            formData.activity_id = validator.escape(formData.activity_id.trim());
            formData.date = validator.escape(formData.date);
            formData.start_time = validator.escape(formData.start_time);
            formData.location_id = validator.escape(formData.location_id.trim());
            formData.trainer_id = validator.escape(formData.trainer_id.trim());
        }
    
        const session = new SessionModel(
            selectedSessionId,
            formData["activity_id"],
            formData["date"],
            formData["start_time"],
            formData["location_id"],
            formData["trainer_id"]
        );
    
        if (action === "create") {
            SessionModel.create(session)
                .then(result => {
                    res.redirect("/session")
                })
                .catch(error => {
                    console.error(error);
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The session could not be created.",
                    });
                });
        } else if (action === "update") {
            SessionModel.update(session)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/session")
                    } else {
                        res.render("status.ejs", {
                            status: "Session Update Failed",
                            message: "The session could not be found.",
                        });
                    }
                })
                .catch(error => {
                    console.error(error);
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The session could not be updated.",
                    });
                });
        } else if (action === "delete") {
            SessionModel.softDelete(selectedSessionId)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/session")
                    } else {
                        res.render("status.ejs", {
                            status: "Session Deletion Failed",
                            message: "The session could not be found.",
                        });
                    }
                })
                .catch(error => {
                    console.error(error);
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The session could not be deleted.",
                    });
                });
        } else {
            res.render("status.ejs", {
                status: "Invalid Action",
                message: "The form doesn't support this action.",
            });
        }
    }
}
