import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { CiExport } from "react-icons/ci";
import { fetchAPI } from "../api.mjs";

function BookingView() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSessionId = searchParams.get("sessionId");

  const { user } = useAuthenticate();
  const authKey = localStorage.getItem("authKey");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authKey) {
      navigate("/authenticate");
    }
  }, [authKey, navigate]);

  // Fetch bookings or sessions depending on role
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAPI(
        "GET",
        `/bookings/my`,
        null,
        authKey
      );
      console.log("Bookings response:", response);
      console.log(bookings)

      if (response.status !== 200) {
        throw new Error(response.body?.message || "Failed to load data");
      }

      const data = response.body; 

      if (user.role === "trainer") {
        // extract unique sessions where the trainer is you
        const sessions = data
          .map((b) => b.session)
          .filter((s) => s.trainer_id === user.id)
          .map((s) => ({
            ...s,
            activityName: s.activity_name,
            locationName: s.location_name,
            attendeeCount: data.filter((b) => b.session.id === s.id)
              .length,
          }));
        setBookings(sessions);
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

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetchAPI(
        "DELETE",
        `/bookings/${bookingId}`,
        null,
        authKey
      );
      if (res.status !== 200) {
        throw new Error(res.body?.message || "Cancellation failed");
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to cancel booking.");
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error)
    return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <section className="flex flex-col items-center relative p-4">
      <h1 className="text-2xl font-semibold mb-4">
        My {user.role === "trainer" ? "Sessions" : "Bookings"}
      </h1>

      {/* Export Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <CiExport className="text-2xl" />
        <span className="dock-label">Export</span>
      </button>

      {/* List */}
      <div className="w-full max-w-3xl">
        {bookings.length === 0 ? (
          <p className="text-center mt-8">
            No {user.role === "trainer" ? "sessions" : "bookings"} found.
          </p>
        ) : (
          bookings.map((item) => {
            if (user.role === "trainer") {
              return (
                <div key={item.id} className="border p-4 rounded mb-4">
                  <h2 className="text-lg font-medium">
                    {item.activityName}
                  </h2>
                  <p>
                    Date:{" "}
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                  <p>Time: {item.start_time}</p>
                  <p>Location: {item.locationName}</p>
                  <p>Attendees: {item.attendeeCount}</p>
                </div>
              );
            }
            return (
              <div
                key={item.id}
                className={`border p-4 rounded mb-4 ${
                  item.status === "cancelled" ? "opacity-50" : ""
                }`}
              >
                <h2 className="text-lg font-medium">
                  {item.activity.name}
                </h2>
                <p>
                  Date:{" "}
                  {new Date(item.session.date).toLocaleDateString()}
                </p>
                <p>Time: {item.session.start_time}</p>
                <p>
                  Location: {item.location.address},{" "}
                  {item.location.name}
                </p>
                <p>
                  Trainer: {item.trainer.first_name}{" "}
                  {item.trainer.last_name}
                </p>
                <p>Status: {item.status}</p>
                {item.status === "active" && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to cancel this booking?"
                        )
                      ) {
                        cancelBooking(item.id);
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

      {/* Export Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80 relative">
            <button
              className="absolute top-2 right-3 text-gray-600 text-xl"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">
              Export XML
            </h2>
            <div className="flex flex-col gap-3">
              {user.role === "trainer" ? (
                <button
                  onClick={() =>
                    navigate(
                      `/booking/xml/trainer?trainerId=${user.id}`
                    )
                  }
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  Export My Sessions
                </button>
              ) : (
                <button
                  onClick={() =>
                    navigate(
                      `/booking/xml/member?memberId=${user.id}`
                    )
                  }
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Export My Bookings
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BookingView;
