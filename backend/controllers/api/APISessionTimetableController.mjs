import express from "express";
import { SessionTrainerActivityLocationModel } from "../../models/SessionTrainerActivityLocationModel.mjs";
import { UserModel } from "../../models/UserModel.mjs";

export class APISessionTimetableController {
    /**
     * router for session timetable routes.
     * @type {express.Router}
     */
    static routes = express.Router();

    static {
      this.routes.get("/", this.viewSessions);
    }

    /**
     * Groups session data by day and activity.
     * Checks for duplication. 
     * @param {Array} sessions - List of session data including session, activity, location, and trainer details.
     * @returns {Object} - Grouped sessions organised by day and activity.
     */
    static groupSessionsByDayAndActivity(sessions) {
      return sessions.reduce((grouped, s) => {
        const session = s.session;
        const activity = s.activity;
        const location = s.location;
        const trainer = s.trainer;
    
        if (!session || !activity || !location || !trainer) {
          console.warn("Missing session, activity, location, or trainer data");
          return grouped;
        }
    
        const day = new Date(session.date).toLocaleDateString();
        const activityName = activity.name;
    
        if (!grouped[day]) {
          grouped[day] = {};
        }
        if (!grouped[day][activityName]) {
          grouped[day][activityName] = [];
        }
    
        const existingSlot = grouped[day][activityName].find(
          (entry) =>
            entry.session.start_time === session.start_time &&
            entry.location.id === location.id
        );
    
        if (existingSlot) {
          existingSlot.trainers.push(trainer);
          existingSlot.sessionIds.push(session.id);
        } else {
          grouped[day][activityName].push({
            session: session,          
            location: location,
            activity: activity,
            trainers: [trainer],       
            sessionIds: [session.id], 
          });
        }
        return grouped;
      }, {});
    }
    
    /**
     * Renders the session timetable.
     * Gets users from UserModel.getAll for the trainer filter.
     * Gets the activities from SessionTrainerActivityLocationModel.getAll for the activity filter.
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @openapi
     * /api/timetable:
     *   get:
     *     summary: Retrieve sessions grouped by day and activity
     *     security:
     *       - ApiKey: []  
     *     parameters:
     *       - in: query
     *         name: location
     *         schema:
     *           type: string
     *         description: Filter sessions by location name (exact match) or “all” for no filter.
     *       - in: query
     *         name: sessionId
     *         schema:
     *           type: integer
     *         description: Highlight a specific session by its ID.
     *     responses:
     *       '200':
     *         description: A map of dates → activities → session slots
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
    static viewSessions(req, res) {
      if (!req.authenticatedUser) {
        return res.status(401).render("status.ejs", {
          status: "Unauthorised",
          message: "Please login to view sessions.",
        });
      }
  
      const location = req.query.location;
      const sessionId = req.query.sessionId || null;
  
      Promise.all([
        SessionTrainerActivityLocationModel.getAll(),
        UserModel.getAll() 
      ])
        .then(([joinSessions, users]) => {
  
          if (location && location !== "all") {
            joinSessions = joinSessions.filter(
              (item) => item.location.name === location
            );
          }
  
          const groupedSessions = SessionTimetableController.groupSessionsByDayAndActivity(joinSessions);
          const activities = [...new Map(joinSessions.map((item) => [item.activity.id, item.activity])).values()];
          const trainers = users.filter((user) => user.role === "trainer");
  
          const selectedSession = sessionId
            ? joinSessions.find((item) => item.session.id == sessionId)
            : null;
  
          res.render("session_timetable.ejs", {
            sessions: groupedSessions,
            locations: [...new Set(joinSessions.map((item) => item.location.name))],
            activities,
            trainers,
            session: selectedSession ? selectedSession.session : null,
            authenticatedUser: req.authenticatedUser,
            role: req.authenticatedUser.role,
          });
        })
        .catch((error) => {
          console.error("Error fetching sessions:", error);
          res.status(500).render("status.ejs", {
            status: "Error",
            message: "An error occurred while retrieving sessions.",
          });
        });
    }
}
