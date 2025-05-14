import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { fetchAPI } from "../api.mjs";

function TimetableView() {
  const navigate = useNavigate();
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
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const canBook = user?.role === "member";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const getTimetable = useCallback(() => {
    if (!authKey) return;
    setLoading(true);
    setError(null);

    const params = [];
    if (locFilter !== "all") params.push(`location=${encodeURIComponent(locFilter)}`);
    const queryString = params.length ? `?${params.join("&")}` : "";

    fetchAPI("GET", `/timetable${queryString}`, null, authKey)
      .then(response => {
        if (response.status === 200) {
          setSessions(response.body.sessions || {});
          setLocations(response.body.locations || []);
          setActivities(response.body.activities || []);
          setError(null);
        } else {
          setError(response.body.message || "Failed to load timetable");
        }
      })
      .catch(err => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, [authKey, locFilter]);

  useEffect(() => { getTimetable(); }, [getTimetable]);

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
  Object.entries(sessions || {}).forEach(([day, dayActivities]) => {
    if (!dayActivities || typeof dayActivities !== 'object') return;
    const dayDate = new Date(day);
    if (dayDate < startOfToday) return;

    const activitiesForDay = {};
    Object.entries(dayActivities).forEach(([activityName, slots]) => {
      const upcomingSlots = (slots || [])
        .filter(slot => new Date(`${slot.session.date}T${slot.session.start_time}`) >= new Date())
        .filter(slot => actFilter === "all" || slot.activity.id.toString() === actFilter)
        .sort((a, b) => new Date(`${a.session.date}T${a.session.start_time}`) - new Date(`${b.session.date}T${b.session.start_time}`));

      if (upcomingSlots.length) activitiesForDay[activityName] = upcomingSlots;
    });

    if (Object.keys(activitiesForDay).length) filteredSessions[day] = activitiesForDay;
  });

  const days = Object.keys(filteredSessions).sort((a, b) => new Date(a) - new Date(b));

  if (!days.length) return (
    <section className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-semibold mb-4">Session Timetable</h1>
      <div className="flex flex-col items-center gap-4">
        <span className="text-gray-500">No upcoming sessions match your criteria.</span>
        <button className="btn btn-outline btn-primary" onClick={() => { setLocFilter("all"); setActFilter("all"); }}>
          Reset Filters
        </button>
      </div>
    </section>
  );

  const handleBooking = (e) => {
    e.preventDefault();
    const sessionId = parseInt(e.target.session_id.value, 10);
    const memberId = user?.id;
    if (!memberId) { alert("You must be logged in to book a session."); return; }

    const bookingData = { session_id: sessionId, member_id: memberId, status: "active" };
    fetchAPI("POST", "/bookings", bookingData, authKey)
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
          alert("Booking successful!");
          setShowModal(false);
          setSelectedSlot(null);
        } else {
          alert("Booking failed: " + (response.body?.message || "Unknown error"));
        }
      })
      .catch(err => alert("Error: " + (err.message || "Unknown error")));
  };

  return (
    <section className="flex flex-col items-center p-4 w-full max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Session Timetable</h1>
      <div className="flex gap-4 mb-6 w-full">
        <select className="select select-bordered flex-1" value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          <option value="all">All Locations</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select className="select select-bordered flex-1" value={actFilter} onChange={e => setActFilter(e.target.value)}>
          <option value="all">All Activities</option>
          {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
        </select>
        {(locFilter !== "all" || actFilter !== "all") && (
          <button className="btn btn-outline btn-error" onClick={() => { setLocFilter("all"); setActFilter("all"); }}>
            Reset
          </button>
        )}
      </div>

      {days.map(day => (
        <div key={day} className="w-full mb-8">
          <h2 className="text-xl font-medium mb-4">{new Date(day).toLocaleDateString()}</h2>
          {Object.entries(filteredSessions[day]).map(([activityName, slots]) => (
            <div key={activityName} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{activityName}</h3>
              <ul className="space-y-4">
                {slots.map(slot => {
                  const isBooked = slot.session.bookings?.some(booking => booking.member_id === user.id);
                  const showButton = canBook && !isBooked;
                  return (
                    <li key={slot.session.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm transition bg-white">
                      <div className="space-y-1">
                        <div className="font-semibold text-lg text-black">{slot.session.start_time}</div>
                        <div className="text-sm text-gray-600">📍 {slot.location.name}</div>
                        <div className="text-sm text-gray-600">Trainers: {[...new Set(slot.trainers.map(t => `${t.first_name} ${t.last_name}`))].join(', ')}</div>
                      </div>
                      {showButton ? (
                        <button className="btn btn-primary" onClick={() => {
                          const sameSlotSessions = slot.sessionIds?.map((id, i) => 
                            ({ sessionId: id, trainerName: `${slot.trainers[i].first_name} ${slot.trainers[i].last_name}` })) || [];
                          setSelectedSlot({ ...slot, sameSlotSessions });
                          setShowModal(true);
                        }}>
                          Book
                        </button>
                      ) : (
                        <span className="text-gray-400">{isBooked ? "Already Booked" : "Booking Unavailable"}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}

      {showModal && selectedSlot && (
        <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative text-black">
            <button className="absolute top-3 right-3 p-3 btn btn-outline btn-error" onClick={() => { setShowModal(false); setSelectedSlot(null); }}>
              <span className="text-2xl font-semibold">✕</span>
            </button>
            <h2 className="text-xl font-bold mb-4">Book a Session</h2>
            <p className="mb-2"><strong>Activity:</strong> {selectedSlot.activity.name}</p>
            <p className="mb-2"><strong>Time & Date:</strong> {selectedSlot.session.start_time} on {new Date(selectedSlot.session.date).toLocaleDateString()}</p>
            <p className="mb-4"><strong>📍 Location:</strong> {selectedSlot.location.name}</p>
            <form onSubmit={handleBooking}>
              <label htmlFor="sessionSelect" className="block mb-1 font-medium">Select Trainer:</label>
              <select id="sessionSelect" name="session_id" className="select select-bordered w-full mb-4 bg-gray-200">
                {(selectedSlot.sameSlotSessions || []).length > 0 ?
                  [...new Map(selectedSlot.sameSlotSessions.map(opt => [
                    opt.trainerName.trim(),
                    <option key={opt.sessionId} value={opt.sessionId}>👤 {opt.trainerName}</option>
                  ])).values()]
                  : <option value={selectedSlot.session.id}>{selectedSlot.trainers[0]?.first_name} {selectedSlot.trainers[0]?.last_name}</option>
                }
              </select>
              <button type="submit" className="btn btn-primary w-full">Confirm Booking</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default TimetableView;
