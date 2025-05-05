import express from "express";
import { SessionTrainerActivityLocationModel } from "../../models/SessionTrainerActivityLocationModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

export class APISessionTimetableController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get("/", APIAuthenticationController.restrict("any"),this.getTimetable);
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/timetable:
   *   get:
   *     summary: "Retrieve sessions grouped by day and activity"
   *     tags: [Sessions]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *         description: "Filter sessions by location name or 'all' for no filter"
   *       - in: query
   *         name: sessionId
   *         schema:
   *           type: integer
   *         description: "Highlight a specific session by its ID"
   *     responses:
   *       '200':
   *         description: "A map of dates → activities → session slots"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties:
   *                 type: object
   *                 additionalProperties:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       session:
   *                         $ref: '#/components/schemas/Session'
   *                       activity:
   *                         $ref: '#/components/schemas/Activity'
   *                       location:
   *                         $ref: '#/components/schemas/Location'
   *                       trainers:
   *                         type: array
   *                         items:
   *                           $ref: '#/components/schemas/User'
   *                       sessionIds:
   *                         type: array
   *                         items:
   *                           type: integer
   *       '401':
   *         $ref: '#/components/responses/NotFound'
   *       '500':
   *         $ref: '#/components/responses/Error'
   */
  static async getTimetable(req, res) {
    try {
      const locationFilter = req.query.location;
      const highlightId = req.query.sessionId || null;

      let sessions = await SessionTrainerActivityLocationModel.getAll();
      if (locationFilter && locationFilter !== "all") {
        sessions = sessions.filter(item => item.location.name === locationFilter);
      }

      const grouped = this.groupSessionsByDayAndActivity(sessions);
      const activities = [...new Map(sessions.map(item => [item.activity.id, item.activity])).values()];
      const trainers = (await APIAuthenticationController.middleware, await Promise.resolve([])); 

      const selectedSession = highlightId
        ? sessions.find(item => item.session.id == highlightId)?.session || null
        : null;

      return res.status(200).json({
        sessions: grouped,
        activities,
        locations: [...new Set(sessions.map(item => item.location.name))],
        trainers, 
        selectedSession
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to retrieve timetable" });
    }
  }

  /**
  * Groups session data by day and activity.
  * Checks for duplication. 
  * @param {Array} sessions - List of session data including session, activity, location, and trainer details.
  * @returns {Object} - Grouped sessions organised by day and activity.
  */
  static groupSessionsByDayAndActivity(sessions) {
    return sessions.reduce((grouped, s) => {
      const sess = s.session;
      const activity = s.activity;
      const location = s.location;
      const trainer = s.trainer;
      if (!sess || !activity || !location || !trainer) return grouped;

      const day = new Date(sess.date).toISOString().split('T')[0];
      const actName = activity.name;
      grouped[day] = grouped[day] || {};
      grouped[day][actName] = grouped[day][actName] || [];

      const slot = grouped[day][actName].find(
        entry => entry.session.start_time === sess.start_time && entry.location.id === location.id
      );
      if (slot) {
        slot.trainers.push(trainer);
        slot.sessionIds.push(sess.id);
      } else {
        grouped[day][actName].push({
          session: sess,
          location,
          activity,
          trainers: [trainer],
          sessionIds: [sess.id]
        });
      }
      return grouped;
    }, {});
  }
}
