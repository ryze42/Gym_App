import express from "express";
import { SessionTrainerActivityLocationModel } from "../../models/SessionTrainerActivityLocationModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";
import { UserModel } from "../../models/UserModel.mjs";

export class APISessionTimetableController {
  static routes = express.Router();

  static {
    this.routes.use(APIAuthenticationController.middleware);
    this.routes.get(
      "/",
      APIAuthenticationController.restrict("any"),
      this.getTimetable.bind(APISessionTimetableController)
    );
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
   *               required:
   *                 - authenticationKey
   *                 - sessions
   *                 - activities
   *                 - locations
   *                 - trainers
   *               properties:
   *                 authenticationKey:
   *                   $ref: '#/components/schemas/AuthenticationKey'
   *                 sessions:
   *                   type: object
   *                   additionalProperties:
   *                     type: object
   *                     additionalProperties:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           session:
   *                             $ref: '#/components/schemas/Session'
   *                           activity:
   *                             $ref: '#/components/schemas/Activity'
   *                           location:
   *                             $ref: '#/components/schemas/Location'
   *                           trainers:
   *                             type: array
   *                             items:
   *                               $ref: '#/components/schemas/User'
   *                           sessionIds:
   *                             type: array
   *                             items:
   *                               type: integer
   *                 activities:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Activity'
   *                 locations:
   *                   type: array
   *                   items:
   *                     type: string
   *                 trainers:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 selectedSession:
   *                   type: object
   *                   properties:
   *                     session:
   *                       $ref: '#/components/schemas/Session'
   *                   required:
   *                     - session
   *                   nullable: true
   *       '401':
   *         $ref: '#/components/responses/NotFound'
   *       '500':
   *         $ref: '#/components/responses/Error'
   */
  static async getTimetable(req, res) {
    try {
      const location = req.query.location;
      const sessionId = req.query.sessionId || null;

      const [joinSessionsRaw, users] = await Promise.all([
        SessionTrainerActivityLocationModel.getAll(),
        UserModel.getAll()
      ]);

      let joinSessions = joinSessionsRaw;

      if (location && location !== "all") {
        joinSessions = joinSessions.filter(
          (item) => item.location.name === location
        );
      }

      const groupedSessions = APISessionTimetableController.groupSessionsByDayAndActivity(joinSessions);
      const activities = [...new Map(joinSessions.map((item) => [item.activity.id, item.activity])).values()];
      const trainers = users.filter((user) => user.role === "trainer");
      const locations = [...new Set(joinSessions.map((item) => item.location.name))];
      const apiKey = req.headers["x-auth-key"];

      const selectedSession = sessionId
        ? joinSessions.find((item) => item.session.id == sessionId)
        : null;

      const formattedSelectedSession = selectedSession
        ? {
            session: {
              ...selectedSession.session, 
              date: selectedSession.session.date,
              start_time: selectedSession.session.start_time,
            }
          }
        : null;

      return res.status(200).json({
        authenticationKey: { key: apiKey },
        // log whole object, check response schema to see if it matches
        sessions: groupedSessions,
        activities,
        locations,
        trainers,
        selectedSession: formattedSelectedSession
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to retrieve timetable" });
    }
  }
/// add a pattern for time 
  /**
   * Groups sessions into slots by date and activity
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

  // static formatDateString(value) {
  //   if (!value) return "2025-01-01";
  //   const date = new Date(value);

  //   return date.toISOString().substring(0, 10); 
  // }

  // static formatTimeString(value) {
  //   if (!value) return "00:00";
  //   const date = new Date(`2025-01-01T${value}`);
    
  //   return date.toTimeString().substring(0, 5);
  // }
}
