import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { BookingSessionTrainerActivityLocationModel } from "../models/BookingSessionTrainerActivityLocationModel.mjs";
import { SessionTrainerActivityLocationModel } from "../models/SessionTrainerActivityLocationModel.mjs";
import { UserModel } from "../models/UserModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";
import validator from "validator";

export class BookingController {
    /**
     * router for booking routes.
     * @type {express.Router}
     */
    static routes = express.Router();

    static {
        this.routes.get("/my_bookings", this.viewMyBookings);
        this.routes.get("/book_session", this.bookSession);
        this.routes.get("/book_session/:id", this.bookSession);
        this.routes.get("/", this.viewBookingManagement); 
        this.routes.get("/:id", this.viewBookingManagement); 

        this.routes.post("/confirm_session_booking", this.confirmSessionBooking);
        this.routes.post("/", this.handleBookingManagement); 
        this.routes.post("/:id", this.handleBookingManagement); 
        this.routes.post("/delete/:id", this.deleteBooking);  
    }

    /**
     * Renders the booking management page.
     * Only accessible by admins. 
     * @param {express.Request} req
     * @param {express.Response} res 
     */
    static viewBookingManagement(req, res) {
        if (!req.authenticatedUser || req.authenticatedUser.role !== "admin") {
            return res.status(403).render("status.ejs", {
                status: "Forbidden",
                message: "Access denied :)"
            });
        }

        const selectedBookingId = req.params.id || null;

        Promise.all([
            BookingSessionTrainerActivityLocationModel.getAll(),
            SessionTrainerActivityLocationModel.getAll(),
            UserModel.getAll(),
            ActivityModel.getAll(),
            LocationModel.getAll(),
        ])
        .then(([bookings, sessions, users, activities, locations]) => {
            const selectedBooking = bookings.find(
                booking => booking.booking.id == selectedBookingId
            ) || {
                booking: new BookingModel(null, "", "", "", "", "", "", "", "active"),
                session: {},
                trainer: {},
                activity: {},
                location: {}
            };

            const trainers = users.filter(user => user.role === 'trainer');
            const members = users.filter(user => user.role === 'member');

            res.render("crud_bookings.ejs", {
                bookings,
                selectedBooking,
                sessions,
                trainers,
                activities,
                locations,
                members,
                role: "admin",
                authenticatedUser: req.authenticatedUser
            });
        })
        .catch(error => {
            console.error(error);
            res.status(500).render("status.ejs", {
                status: "Error",
                message: "An error occurred while fetching booking details."
            });
        });
    }
    
    /**
     * Handles booking creation, updating, and deletion.
     * Runs through validation and sanitisation before sending form data to database. 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static handleBookingManagement(req, res) {
        const selectedBookingId = req.params.id;
        const formData = req.body;
        const action = formData.action;

        if (action === "create" || action === "update") {
            if (!formData.member_id || !/^\d{1,50}$/.test(formData.member_id.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid member (1-50 digits only)."
                });
            }
            
            if (!formData.session_id || !/^\d{1,50}$/.test(formData.session_id.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid Trainer ID (1-50 digits only)."
                });
            }

            const validStatus = ['active', 'cancelled'];
            if (!formData.status || !validStatus.includes(formData.status.trim())) {
                return res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid status (either 'active' or 'cancelled')."
                });
            }

            formData.member_id = validator.escape(formData.member_id.trim());
            formData.session_id = validator.escape(formData.session_id.trim());
            formData.status = validator.escape(formData.status.trim());
        }    
        
        const booking = new BookingModel(
            selectedBookingId,
            formData["member_id"],
            formData["session_id"],
            formData["status"] || "active"
        );
    
        if (action == "create") {
            BookingModel.create(booking)
                .then(result => {
                    res.redirect("/booking");
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The booking could not be created.",
                    });
                    console.error(error);
                });
        } else if (action == "update") {
            BookingModel.update(booking)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/booking");
                    } else {
                        res.render("status.ejs", {
                            status: "Booking Update Failed",
                            message: "The booking could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The booking could not be updated.",
                    });
                    console.error(error);
                });
        } else if (action == "delete") {
            BookingModel.cancel(selectedBookingId)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/booking");
                    } else {
                        res.render("status.ejs", {
                            status: "Booking Cancellation Failed",
                            message: "The booking could not be found.",
                        });
                    }
                })
                .catch(error => {
                    res.render("status.ejs", {
                        status: "Database Error",
                        message: "The booking could not be cancelled.",
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
    
    /**
     * Renders the current (authenticated / logged in) user's bookings.
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static viewMyBookings(req, res) {
        if (!req.authenticatedUser) {
            return res.status(401).render("status.ejs", {
                status: "Unauthorised",
                message: "Please log in to view your bookings."
            });
        }
    
        BookingSessionTrainerActivityLocationModel.getAll()
            .then(bookings => {
                const personalBookings = bookings.filter(booking => booking.booking.member_id == req.authenticatedUser.id);
                
                res.render("my_bookings.ejs", {
                    bookings: personalBookings,
                    authenticatedUser: req.authenticatedUser,
                    role: req.authenticatedUser.role
                });
            })
            .catch(error => {
                console.error("Error fetching bookings:", error);
                res.status(500).render("status.ejs", {
                    status: "Error",
                    message: "Error fetching your bookings. Please try again later."
                });
            });
    }
    
    /**
     * Deletes a booking by its ID.
     * @param {express.Request} req 
     * @param {express.Response} res
     */
    static deleteBooking(req, res) {
        const { id } = req.params;
    
        BookingModel.cancel(id)
            .then(result => {
                if (result.affectedRows > 0) {
                    if (req.authenticatedUser && req.authenticatedUser.role === "member") {
                        res.redirect("/booking/my_bookings");
                    } else {
                        res.redirect("/booking");
                    }
                } else {
                    res.render("status.ejs", {
                        status: "Booking Cancellation Failed",
                        message: "The booking could not be found.",
                    });
                }
            })
            .catch(error => {
                res.render("status.ejs", {
                    status: "Database Error",
                    message: "The booking could not be cancelled.",
                });
                console.error(error);
            });
    }
    
    /**
     * Renders the 'Book a Session' page.
     * This method retrieves the session details and available trainers for the selected session.
     * @param {express.Request} req - The request object containing session ID in params and user authentication data.
     * @param {express.Response} res - The response object used to render the booking page or show errors.
     */
    static bookSession(req, res) {
        const { id } = req.params;  
        const memberId = req.authenticatedUser && req.authenticatedUser.id;
      
        if (!memberId) {
          return res.status(401).render("status.ejs", {
            status: "Unauthorised",
            message: "Please log in to book a session."
          });
        }

        SessionTrainerActivityLocationModel.getBookingDetailsBySessionId(id)
          .then(details => {
            if (!details || !details.session) {
              return res.status(404).render("status.ejs", {
                status: "Error",
                message: "Session not found."
              });
            }
      
            const { date, start_time } = details.session.session;
            const activity_id = details.session.activity.id;
            const location_id = details.session.location.id;
            const formattedDate = new Date(date).toISOString().split('T')[0];
      
            return SessionTrainerActivityLocationModel
              .getSessionsByDateTimeActivityLocation(date, start_time, activity_id, location_id)
              .then(sameSlotSessions => {
                res.render("book_session.ejs", {
                  session: details.session,   
                  sameSlotSessions,           
                  authenticatedUser: req.authenticatedUser,
                  role: "member"
                });
              });
          })
          .catch(error => {
            console.error(error);
            res.status(500).render("status.ejs", {
              status: "Error",
              message: "Error fetching session details for booking."
            });
          });
    }
      
    /**
     * Confirms and creates a session booking.
     * @param {express.Request} req
     * @param {express.Response} res
     */
    static confirmSessionBooking(req, res) {
        const formData = req.body;        
        const sessionId = formData.session_id;        
        const memberId = req.authenticatedUser.id;
        
        SessionTrainerActivityLocationModel.getBookingDetailsBySessionId(sessionId)
            .then(details => {
                if (!details || !details.session) {
                    return res.status(404).render("status.ejs", {
                        status: "Error",
                        message: "Session not found."
                    });
                }
                
                const booking = new BookingModel(
                    null,
                    memberId,
                    sessionId,
                    "active"
                );
                
                return BookingModel.create(booking);
            })
            .then(result => {
                res.redirect("/booking/my_bookings");
            })
            .catch(error => {
                console.error("Booking error:", error);
                res.render("status.ejs", {
                    status: "Database Error",
                    message: "The booking could not be created. Please try again later.",
                });
            });
    }
}
