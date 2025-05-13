import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/useAuthenticate";
import { CiExport } from "react-icons/ci";

function BookingView() {
    const [isModalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedSessionId = searchParams.get("sessionId");
    const { user } = useAuthenticate();
    const authKey = localStorage.getItem("authKey");
    
    
    useEffect(() => {
      if (!authKey) {
        navigate("/authenticate");
      }
    }, [authKey, navigate]);  

    return (
        <section className="flex flex-col items-center relative">
            <h1 className="text-2xl font-semibold mb-4">My Bookings</h1>

            <button
                onClick={() => setModalOpen(true)}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                <CiExport className="text-2xl" />
                <span className="dock-label">Export</span>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-80 relative">
                        <button
                            className="absolute top-2 right-3 text-gray-600 text-xl"
                            onClick={() => setModalOpen(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-lg font-semibold mb-4">Export XML</h2>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate("/booking/xml/member")}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                            >
                                Export as Member
                            </button>
                            <button
                                onClick={() => navigate("/booking/xml/trainer")}
                                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                            >
                                Export as Trainer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default BookingView;


// include xml export button (top right of screen), member exports , trainer exports sessions they are in. 
// trainer sees activity and number of people in the session.  (their sessions)
// member sees the usual details as before. (their bookings) 
