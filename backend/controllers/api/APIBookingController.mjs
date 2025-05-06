import express from "express";
import { BookingModel } from "../../models/BookingModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APIBookingController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/", APIAuthenticationController.restrict(["admin"]), this.getAllBookings);
    this.routes.get("/my", APIAuthenticationController.restrict(["member", "trainer", "admin"]),this.getMyBookings);
    this.routes.get("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.getBookingById);
    this.routes.post("/", APIAuthenticationController.restrict(["member", "trainer", "admin"]), this.createBooking);
    this.routes.put("/:id", APIAuthenticationController.restrict(["admin", "member", "trainer"]), this.updateBooking);
    this.routes.delete("/:id",APIAuthenticationController.restrict(["admin", "member", "trainer"]),this.deleteBooking);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings:
   *   get:
   *     summary: "Get all bookings (admin only)"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: "List of all bookings"
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Booking"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getAllBookings(req, res) {
    try {
      const bookings = await BookingModel.getAll();
      res.status(200).json(bookings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
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
   *                 $ref: "#/components/schemas/Booking"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getMyBookings(req, res) {
    try {
      const userId = req.authenticatedUser.id;
      const bookings = await BookingModel.getByMemberId(userId);
      res.status(200).json(bookings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user bookings" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/{id}:
   *   get:
   *     summary: "Get a booking by ID"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BookingId"
   *     responses:
   *       '200':
   *         description: "Booking found"
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Booking"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getBookingById(req, res) {
    try {
      const booking = await BookingModel.getById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (req.authenticatedUser.role === "member" && booking.member_id !== req.authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.status(200).json(booking);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch booking" });
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
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async createBooking(req, res) {
    const { session_id, status } = req.body;
    const member_id = req.authenticatedUser.id;
    if (!Number.isInteger(session_id) || !(status === "active" || status === "cancelled")) {
      return res.status(400).json({ message: "Invalid input" });
    }
    try {
      const newBooking = { member_id, session_id, status };
      const result = await BookingModel.create(newBooking);
      res.status(201).json({ id: result.insertId, message: "Item created" });
    } catch (err) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/{id}:
   *   put:
   *     summary: "Update a booking by ID"
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - $ref: "#/components/parameters/BookingId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/Booking"
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/Updated"
   *       '400':
   *         $ref: "#/components/responses/Error"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async updateBooking(req, res) {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!(status === "active" || status === "cancelled")) {
      return res.status(400).json({ message: "Invalid status" });
    }
    try {
      const existing = await BookingModel.getById(id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });
      if (req.authenticatedUser.role === "member" && existing.member_id !== req.authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await BookingModel.update({ id, member_id: existing.member_id, session_id: existing.session_id, status });
      res.status(200).json({ message: "Item updated" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update booking" });
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
      const existing = await BookingModel.getById(id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });
      if (req.authenticatedUser.role === "member" && existing.member_id !== req.authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await BookingModel.cancel(id);
      res.status(200).json({ message: "Booking cancelled" });
    } catch (err) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  }


  /**
     * Handle exporting all complete orders to XML
     * 
     * @type {express.RequestHandler}
     * @openapi
     * /api/bookings/xml:
     *      get:
     *          summary: "Export all complete orders to XML"
     *          tags: [Orders]
     *          security:
     *              - ApiKey: [] 
     *          responses:
     *              '200':
     *                  description: 'Complete orders XML'
     *                  content:
     *                      text/xml:
     *                          schema:
     *                              type: array
     *                              xml:
     *                                  name: orders
     *                              items:
     *                                  type: object
     *                                  properties:
     *                                      id:
     *                                          type: string
     *                                          example: 1
     *                                      date:
     *                                          type: string
     *                                          format: date
     *                                      customer:
     *                                          type: object
     *                                          properties:
     *                                              name:
     *                                                  type: string
     *                                                  example: John Doe
     *                                              phone:
     *                                                  type: string
     *                                                  example: 0000 000 000
     *                                              email:
     *                                                  type: string
     *                                                  example: john@doe.mail
     *                                      product:
     *                                          type: object
     *                                          properties:
     *                                              name:
     *                                                  type: string
     *                                                  example: Latte
     *                                              price:
     *                                                  type: number
     *                                                  example: 2.50
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
  //   static async getOrdersXML(req, res) {
  //     try {
  //         const orderProducts = await OrderProductModel.getAllByStatus("complete")
          
  //         res.status(200).contentType(text/css).render("xml/orders.xml.ejs", {orderProducts})
  //     } catch (error) {
  //         res.status(500).json({
  //             message: "failed to export xml for orders",
  //             errors: [error]
  //         })
  //     }
  // }
}
