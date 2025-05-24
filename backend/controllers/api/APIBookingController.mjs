import express from "express";
import { DatabaseModel } from "../../models/DatabaseModel.mjs";
import { BookingModel } from "../../models/BookingModel.mjs";
import { BookingSessionTrainerActivityLocationModel } from "../../models/BookingSessionTrainerActivityLocationModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APIBookingController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/my", APIAuthenticationController.restrict(["member", "trainer"]),this.getMyBookings);
    this.routes.post("/", APIAuthenticationController.restrict(["member", "admin"]), this.createBooking);
    this.routes.delete("/:id",APIAuthenticationController.restrict(["admin", "member"]),this.deleteBooking);
    this.routes.get("/member/xml",APIAuthenticationController.restrict(["member"]),this.getBookingsXML);
    this.routes.get("/trainer/xml",APIAuthenticationController.restrict(["trainer"]),this.getSessionsXML);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/my:
   *   get:
   *     summary: "Get current user's bookings"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "List of user's bookings"
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/BookingWithDetails"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getMyBookings(req, res) {
    try {
      const userId = req.authenticatedUser.id;
      const role = req.authenticatedUser.role;

      let bookings;

      if (role === "member") {
        bookings = await BookingSessionTrainerActivityLocationModel.getAllForMember(userId);
      } else if (role === "trainer") {
        bookings = await BookingSessionTrainerActivityLocationModel.getAllByTrainer(userId);
      } else if (role === "admin") {
        bookings = await BookingSessionTrainerActivityLocationModel.getAll();
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.status(200).json(bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ message: "Failed to fetch user bookings" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings:
   *   post:
   *     summary: "Create a new booking"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/Booking"
   *     responses:
   *       '201':
   *         $ref: "#/components/responses/Created"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       '409':
   *         description: "Conflict - duplicate booking"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "You have already booked this session."
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async createBooking(req, res) {
    const { session_id, status } = req.body;
    const member_id = req.authenticatedUser.id;

    if (!Number.isInteger(session_id) || !["active", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid input" });
    }
    try {
      const result = await BookingModel.query(
        `SELECT id
          FROM bookings
          WHERE session_id = ?
            AND member_id  = ?`,
        [session_id, member_id]
      );
      const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : [];

      if (rows.length > 0) {
        return res
          .status(409)
          .json({ message: "You have already booked this session." });
      }
      const insertResult = await BookingModel.create({ session_id, member_id, status });

      return res
        .status(201)
        .json({ id: insertResult.insertId, message: "Booking created" });

    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ message: "You have already booked this session." });
      }
      console.error("Error in createBooking:", err);
      return res.status(500).json({ message: "Failed to create booking" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/{id}:
   *   delete:
   *     summary: "Cancel a booking by ID"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BookingId"
   *     responses:
   *       '200':
   *         description: "Booking cancellation successful"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Booking cancelled"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async deleteBooking(req, res) {
    const id = parseInt(req.params.id, 10);
    try {
      const existing = await BookingSessionTrainerActivityLocationModel.getByBookingId(id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });
      if (
        req.authenticatedUser.role === "member" &&
        existing.booking.member_id !== req.authenticatedUser.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await BookingModel.cancel(id);
      res.status(200).json({ message: "Booking cancelled" });
    } catch (err) {
      console.error("Error in deleteBooking:", err);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  }

  /**
   * Export all bookings of the authenticated member to XML
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/member/xml:
   *   get:
   *     summary: "Export member's bookings to XML"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "XML of member's bookings"
   *         content:
   *           text/xml:
   *             schema:
   *               type: array
   *               xml:
   *                 name: bookings
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   date:
   *                     type: string
   *                     format: date
   *                   status:
   *                     type: string
   *                   session:
   *                     type: object
   *                     properties:
   *                       name:
   *                         type: string
   *                       location:
   *                         type: string
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getBookingsXML(req, res) {
    try {
      const memberId = req.authenticatedUser?.id;
      const exportDate = DatabaseModel.toMySqlDate(new Date());

      const bookings = await BookingSessionTrainerActivityLocationModel.getAll(memberId);

      res.status(200).contentType("text/xml").render("xml/bookings.xml.ejs", {
        bookingDetails: bookings,
        exportDate
      });
    } catch (error) {
      console.error("Error exporting XML:", error);
      res.status(500).json({
        message: "Failed to export XML for bookings",
        errors: [error.message || error]
      });
    }
  }

  /**
   * Export all sessions of the authenticated trainer to XML
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/trainer/xml:
   *   get:
   *     summary: "Export trainer's sessions to XML"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "XML of trainer's sessions"
   *         content:
   *           text/xml:
   *             schema:
   *               type: array
   *               xml:
   *                 name: sessions
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   date:
   *                     type: string
   *                     format: date
   *                   activity:
   *                     type: string
   *                   location:
   *                     type: string
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getSessionsXML(req, res) {
    try {
      const trainerId = req.authenticatedUser.id;
      const exportDate = DatabaseModel.toMySqlDate(new Date());
      const sessions = await BookingSessionTrainerActivityLocationModel.getAllByTrainer(trainerId);

      res.status(200).contentType("text/xml").render("xml/sessions.xml.ejs", {
        sessions,
        exportDate
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to export XML for sessions",
        errors: [error]
      });
    }
  }
}
