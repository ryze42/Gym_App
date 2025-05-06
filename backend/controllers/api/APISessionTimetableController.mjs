import express from "express";
import { SessionTrainerActivityLocationModel } from "../../models/SessionTrainerActivityLocationModel.mjs";
import { APIAuthenticationController } from "../api/APIAuthenticationController.mjs";

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
   *                   nullable: true
   *                   allOf:
   *                     - $ref: '#/components/schemas/Session'
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

      // Ensure time format is correct before grouping by creating deep copies
      // and properly formatting all time and date fields
      sessions = sessions.map(item => {
        const itemCopy = JSON.parse(JSON.stringify(item)); // Deep copy to avoid modifying originals
        
        if (itemCopy.session) {
          // Format date field
          if (itemCopy.session.date) {
            itemCopy.session.date = this.formatDateString(itemCopy.session.date);
          }
          
          // Format time fields
          if (itemCopy.session.start_time) {
            itemCopy.session.start_time = this.formatTimeString(itemCopy.session.start_time);
          }
          
          if (itemCopy.session.end_time) {
            itemCopy.session.end_time = this.formatTimeString(itemCopy.session.end_time);
          }
          
          if (itemCopy.session.creation_time) {
            itemCopy.session.creation_time = this.formatTimeString(itemCopy.session.creation_time);
          }
        }
        
        return itemCopy;
      });

      const grouped = this.groupSessionsByDayAndActivity(sessions);
      const activities = [...new Map(sessions.map(item => [item.activity.id, item.activity])).values()];
      const trainers = [];

      let selectedSession = null;
      if (highlightId) {
        const foundSession = sessions.find(item => item.session.id == highlightId);
        if (foundSession) {
          // Create a deep copy to avoid modifying the original
          selectedSession = JSON.parse(JSON.stringify(foundSession.session));
          
          // Ensure date format is correct
          if (selectedSession.date) {
            selectedSession.date = this.formatDateString(selectedSession.date);
          }
          
          // Ensure time formats are correct
          if (selectedSession.start_time) {
            selectedSession.start_time = this.formatTimeString(selectedSession.start_time);
          }
          if (selectedSession.end_time) {
            selectedSession.end_time = this.formatTimeString(selectedSession.end_time);
          }
          if (selectedSession.creation_time) {
            selectedSession.creation_time = this.formatTimeString(selectedSession.creation_time);
          }
        }
      }

      // Grab the raw API key from header or authenticated user record
      const rawKey =
        req.headers["x-auth-key"] ||
        req.authenticatedUser?.authenticationKey;

      return res.status(200).json({
        authenticationKey: { key: rawKey },
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
   * Formats a time value to ensure it's in the standard HH:MM:SS format
   * that matches the OpenAPI 'time' format specification
   * @param {string|Date|number} timeValue - The time value to format
   * @returns {string} - Formatted time string in HH:MM:SS format
   */
  static formatTimeString(timeValue) {
    if (!timeValue) return "00:00:00";
    
    try {
      // If it's already a properly formatted time string that matches HH:MM:SS
      if (typeof timeValue === 'string' && /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(timeValue)) {
        return timeValue;
      }
      
      // If it's just hours and minutes (HH:MM)
      if (typeof timeValue === 'string' && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeValue)) {
        // Split the time string to get hours and minutes
        const [hours, minutes] = timeValue.split(':');
        // Format with padded zeros and add seconds
        return `${hours.padStart(2, '0')}:${minutes}:00`;
      }
      
      // If it's a date object
      if (timeValue instanceof Date) {
        const hours = String(timeValue.getHours()).padStart(2, '0');
        const minutes = String(timeValue.getMinutes()).padStart(2, '0');
        const seconds = String(timeValue.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // If it's a date string, parse it first
      if (typeof timeValue === 'string' && !isNaN(Date.parse(`1970-01-01T${timeValue}`))) {
        const date = new Date(`1970-01-01T${timeValue}`);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // If it's a number (possibly seconds since midnight)
      if (typeof timeValue === 'number') {
        const hours = Math.floor(timeValue / 3600);
        const minutes = Math.floor((timeValue % 3600) / 60);
        const seconds = timeValue % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      
      // For any other string format, try to extract time components
      if (typeof timeValue === 'string') {
        // Try to parse as a time string
        const timeMatch = timeValue.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
        if (timeMatch) {
          const hours = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
          const minutes = String(parseInt(timeMatch[2], 10)).padStart(2, '0');
          const seconds = timeMatch[3] ? String(parseInt(timeMatch[3], 10)).padStart(2, '0') : '00';
          return `${hours}:${minutes}:${seconds}`;
        }
      }
      
      // Default fallback
      return "00:00:00";
    } catch (error) {
      console.error("Error formatting time:", error);
      return "00:00:00"; // Return default time if formatting fails
    }
  }

  /**
   * Formats a date value to ensure it's in the standard YYYY-MM-DD format
   * that matches the OpenAPI 'date' format specification
   * @param {string|Date} dateValue - The date value to format
   * @returns {string} - Formatted date string in YYYY-MM-DD format
   */
  static formatDateString(dateValue) {
    if (!dateValue) return "1970-01-01";
    
    try {
      // If it's already a properly formatted date string that matches YYYY-MM-DD
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // If it's a Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      
      // Try to parse as a Date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Default fallback
      return "1970-01-01";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "1970-01-01"; // Return default date if formatting fails
    }
  }
  static groupSessionsByDayAndActivity(sessions) {
    return sessions.reduce((grouped, s) => {
      const sess = s.session;
      const activity = s.activity;
      const location = s.location;
      const trainer = s.trainer;
      if (!sess || !activity || !location || !trainer) return grouped;

      const day = new Date(sess.date).toISOString().split("T")[0];
      const actName = activity.name;
      grouped[day] = grouped[day] || {};
      grouped[day][actName] = grouped[day][actName] || [];

      const slot = grouped[day][actName].find(
        entry =>
          entry.session.start_time === sess.start_time &&
          entry.location.id === location.id
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