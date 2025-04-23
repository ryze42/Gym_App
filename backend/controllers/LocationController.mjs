import express from "express"
import { LocationModel } from "../models/LocationModel.mjs"
import validator from "validator"

export class LocationController {
    /**
     * router for location management routes.
     * @type {express.Router}
     */
    static routes = express.Router()

    static {
        this.routes.get("/", this.viewLocationManagement)
        this.routes.get("/:id", this.viewLocationManagement)

        this.routes.post("/", this.handleLocationManagement)
        this.routes.post("/:id", this.handleLocationManagement)
    }
    
    /**
     * Renders the location management page.
     * Only accessible by admins.
     * @param {express.Request} req
     * @param {express.Response} res 
     */
    static viewLocationManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }

        const selectedLocationId = req.params.id;
    
        LocationModel.getAll()
            .then(locations => {
                const selectedLocation = locations.find(
                    location => location.id == selectedLocationId
                ) ?? new LocationModel(null, "", "");
    
                res.render("crud_locations.ejs", {
                    locations,
                    selectedLocation,
                    role: "admin",
                    authenticatedUser: req.authenticatedUser
                });
            })
            .catch(error => {
                console.log(error);
                res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "An error occurred while fetching locations."
                });
            });
    }
    
    /**
     * Handles location creation, updating, and deletion.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleLocationManagement(req, res) {
        const selectedLocationId = req.params.id;
        const formData = req.body;
        const action = formData.action;
    
        if (action === "create" || action === "update") {
            if (!formData.name || !/^[a-zA-Z0-9\s\.,!?;:()\-'\"]{3,100}$/.test(formData.name)) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid location name between 3 and 100 characters, containing only alphanumeric characters and common punctuation."
                });
            }
    
            if (!formData.address || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9\s\.,#\-']{5,}$/.test(formData.address.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid address with at least 5 characters, including both letters and numbers. Allowed characters: letters, numbers, spaces, commas, periods, hyphens, and #."
                });
            }            
    
            formData.name = validator.escape(formData.name);
            formData.address = validator.escape(formData.address);
        }
    
        const location = new LocationModel(
            selectedLocationId,
            formData.name,
            formData.address
        );
    
        if (action === "create") {
            LocationModel.create(location)
                .then(result => {
                    res.redirect("/location");
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The location could not be created.",
                    });
                    console.error(error);
                });
        } else if (action === "update") {
            LocationModel.update(location)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/location");
                    } else {
                        res.render("status.ejs", {
                            status: "Location Update Failed",
                            message: "The location could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The location could not be updated.",
                    });
                    console.error(error);
                });
        } else if (action === "delete") {
            LocationModel.delete(selectedLocationId)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/location");
                    } else {
                        res.render("status.ejs", {
                            status: "Location Deletion Failed",
                            message: "The location could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The location could not be deleted.",
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