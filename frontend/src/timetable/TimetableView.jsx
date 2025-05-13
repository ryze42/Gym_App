import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";

function TimetableView() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSessionId = searchParams.get("sessionId");
  const { user } = useAuthenticate();

  const authKey = localStorage.getItem("authKey");

  useEffect(() => {
    if (!authKey) navigate("/authenticate");
  }, [authKey, navigate]);

  const [sessions, setSessions] = useState({});
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locFilter, setLocFilter] = useState("all");
  const [actFilter, setActFilter] = useState("all");

  const getTimetable = useCallback(() => {
    if (!authKey) return;
    setLoading(true);
    setError(null);

    const params = [];
    if (locFilter !== "all") params.push(`location=${encodeURIComponent(locFilter)}`);
    if (selectedSessionId) params.push(`sessionId=${encodeURIComponent(selectedSessionId)}`);
    const queryString = params.length ? `?${params.join('&')}` : "";

    fetchAPI("GET", `/timetable${queryString}`, null, authKey)
      .then(response => {
        if (response.status === 200) {
          setSessions(response.body.sessions);
          setLocations(response.body.locations);
          setActivities(response.body.activities);
          setError(null);
        } else {
          setError(response.body.message || "Failed to load timetable");
        }
      })
      .catch(err => {
        setError(err.message || String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authKey, locFilter, selectedSessionId]);

  useEffect(() => {
    getTimetable();
  }, [getTimetable]);

  if (!authKey) return null;

  if (loading) return (
    <section className="flex flex-col items-center p-4">
      <span className="loading loading-spinner loading-xl"></span>
    </section>
  );

  if (error) return (
    <section className="flex flex-col items-center p-4">
      <span className="text-red-600 p-4">{error}</span>
    </section>
  );

  const filteredSessions = {};
  Object.entries(sessions).forEach(([day, dayActivities]) => {
    const filteredActivities = {};
    
    Object.entries(dayActivities).forEach(([actName, slots]) => {
      const filteredSlots = slots.filter(slot => 
        (actFilter === "all" || slot.activity.id.toString() === actFilter)
      );
      
      if (filteredSlots.length > 0) {
        filteredActivities[actName] = filteredSlots;
      }
    });
    
    if (Object.keys(filteredActivities).length > 0) {
      filteredSessions[day] = filteredActivities;
    }
  });

  const days = Object.keys(filteredSessions);
  if (!days.length) return (
    <section className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-semibold mb-4">Session Timetable</h1>
      <div className="flex flex-col items-center gap-4">
        <span className="text-gray-500">No sessions match your filter criteria.</span>
        <button 
          className="btn btn-outline btn-primary"
          onClick={() => {
            setLocFilter("all");
            setActFilter("all");
          }}
        >
          Reset Filters
        </button>
      </div>
    </section>
  );

  return (
    <section className="flex flex-col items-center p-4 w-full max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Session Timetable</h1>
      <div className="flex gap-4 mb-6 w-full">
        <select
          className="select select-bordered flex-1"
          value={locFilter}
          onChange={e => setLocFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          className="select select-bordered flex-1"
          value={actFilter}
          onChange={e => setActFilter(e.target.value)}
        >
          <option value="all">All Activities</option>
          {activities.map(act => (
            <option key={act.id} value={act.id}>{act.name}</option>
          ))}
        </select>
        {(locFilter !== "all" || actFilter !== "all") && (
          <button 
            className="btn btn-outline btn-error"
            onClick={() => {
              setLocFilter("all");
              setActFilter("all");
            }}
          >
            Reset
          </button>
        )}
      </div>
      {days.map(day => (
        <div key={day} className="w-full mb-8">
          <h2 className="text-xl font-medium mb-4">{day}</h2>
          {Object.entries(filteredSessions[day]).map(([actName, slots]) => (
            <div key={actName} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{actName}</h3>
              <ul className="space-y-4">
                {slots.map(slot => (
                  <li
                    key={slot.session.id}
                    className={`flex justify-between items-center p-4 border rounded-lg shadow-sm transition ${
                      selectedSessionId === slot.session.id.toString() ? 'bg-yellow-100' : 'bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-lg text-black">{slot.session.start_time}</div>
                      <div className="text-sm text-gray-600">📍 {slot.location.name}</div>
                      <div className="text-sm text-gray-600">Trainers: {slot.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}</div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('sessionId', slot.session.id);
                        window.history.pushState({}, '', `?${params.toString()}`);
                        getTimetable();
                      }}
                    >
                      Book
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

export default TimetableView;