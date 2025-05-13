import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { CiExport } from "react-icons/ci";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton"; 

function BookingView() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hidePast, setHidePast] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthenticate();
  const authKey = localStorage.getItem("authKey");

  useEffect(() => {
    if (!authKey) navigate("/authenticate");
  }, [authKey, user, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchAPI("GET", "/bookings/my", null, authKey);
      if (res.status !== 200) throw new Error(res.body?.message);

      const data = res.body;

      if (user.role === "trainer") {
        const trainerSessions = data
          .filter((b) => b.session.trainer_id === user.id)
          .map((b) => ({
            id: b.session.id,
            date: b.session.date,
            start_time: b.session.start_time,
            activityName: b.activity.name,
            locationName: `${b.location.address}, ${b.location.name}`,
            attendeeCount: data.filter((x) => x.session.id === b.session.id).length,
          }))
          .reduce((acc, cur) => {
            if (!acc.find((s) => s.id === cur.id)) acc.push(cur);
            return acc;
          }, []);

        setBookings(trainerSessions);
      } else {
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [user, authKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.role === "trainer") {
      setFilteredBookings(bookings); 
      return;
    }

    let filtered = bookings;

    if (hidePast) {
      const now = new Date();
      filtered = filtered.filter((item) => new Date(item.session.date) >= now);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, hidePast, statusFilter, user]);

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetchAPI("DELETE", `/bookings/${bookingId}`, null, authKey);
      if (res.status !== 200) throw new Error(res.body?.message);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to cancel booking.");
    }
  };

  if (!user) return null;
  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <section className="flex flex-col items-center relative p-4">
      <h1 className="text-2xl font-semibold mb-4">
        My {user.role === "trainer" ? "Sessions" : "Bookings"}
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <CiExport className="text-2xl" />
        Export
      </button>

      {user.role !== "trainer" && (
        <div className="filter-container mb-4 flex items-center gap-4">
          <label htmlFor="booking-filter" className="text-sm font-medium">
            Filter by status:
          </label>
          <select
            id="booking-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label className="flex items-center gap-2 text-sm ml-4">
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => setHidePast(e.target.checked)}
            />
            Hide Past Bookings
          </label>
        </div>
      )}

      <div className="w-full max-w-3xl">
        {filteredBookings.length === 0 ? (
          <p className="text-center mt-8">
            No {user.role === "trainer" ? "sessions" : "bookings"} found.
          </p>
        ) : (
          filteredBookings.map((item) => {
            if (user.role === "trainer") {
              return (
                <div key={item.id} className="border p-4 rounded mb-4 bg-white text-black">
                  <h2 className="text-lg font-medium">{item.activityName}</h2>
                  <p>Date: {new Date(item.date).toLocaleDateString()}</p>
                  <p>Time: {item.start_time}</p>
                  <p>Location: {item.locationName}</p>
                  <p>Attendees: {item.attendeeCount}</p>
                </div>
              );
            }

            return (
              <div
                key={item.booking.id}
                className={`border p-4 rounded mb-4 bg-white text-black ${
                  item.booking.status === "cancelled" ? "opacity-50" : ""
                }`}
              >
                <h2 className="text-lg font-medium">{item.activity.name}</h2>
                <p>Date: {new Date(item.session.date).toLocaleDateString()}</p>
                <p>Time: {item.session.start_time}</p>
                <p>
                  Location: {item.location.address}, {item.location.name}
                </p>
                <p>
                  Trainer: {item.trainer.first_name} {item.trainer.last_name}
                </p>
                <p>Status: {item.booking.status}</p>
                {item.booking.status === "active" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Cancel this booking?")) {
                        cancelBooking(item.booking.id);
                      }
                    }}
                    className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80 relative">
            <button
              className="absolute top-2 right-3 text-gray-600 text-xl"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-black">
              Click to Export XML file
            </h2>
            <div className="flex flex-col gap-3">
              {user.role === "trainer" ? (
                <XMLDownloadButton
                    route={`/api/bookings/trainer/xml`} // corrected route
                    filename={`trainer_sessions_${user.id}.xml`}
                    authenticationKey={authKey}
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                    Export My Sessions
                </XMLDownloadButton>
                ) : (
                <XMLDownloadButton
                    route={`/api/bookings/member/xml`} // corrected route
                    filename={`member_bookings_${user.id}.xml`}
                    authenticationKey={authKey}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Export My Bookings
                </XMLDownloadButton>
                )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BookingView;
