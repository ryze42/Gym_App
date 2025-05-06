import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { fetchAPI } from "../api.mjs";

function TimetableView() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSessionId = searchParams.get("sessionId");

  const authKey = localStorage.getItem("authKey");

  // redirect if not logged in
  useEffect(() => {
    if (!authKey) {
      navigate("/authenticate");
    }
  }, [authKey, navigate]);

  const [sessions, setSessions] = useState({});
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locFilter, setLocFilter] = useState("all");
  const [actFilter, setActFilter] = useState("all");

  useEffect(() => {
    if (!authKey) return; // don't fetch if not logged in

    async function loadTimetable() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (locFilter !== "all") params.append("location", locFilter);
        if (selectedSessionId) params.append("sessionId", selectedSessionId);
        const queryString = params.toString() ? `?${params.toString()}` : "";

        const res = await fetchAPI(
          "GET",
          `/timetable${queryString}`,
          null,
          authKey
        );
        if (res.status !== 200) throw new Error(res.body.message || "Failed to load timetable");

        setSessions(res.body.sessions);
        setLocations(res.body.locations);
        setActivities(res.body.activities);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, [locFilter, selectedSessionId, authKey]);

  if (!authKey) {
    return (
      <section className="flex flex-col items-center p-4">
        <span className="text-red-600 p-4">Please login to view the timetable.</span>
        <button className="btn" onClick={() => navigate('/login')}>Go to Login</button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex flex-col items-center p-4">
        <span className="loading loading-spinner loading-xl"></span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center p-4">
        <span className="text-red-600 p-4">{error}</span>
      </section>
    );
  }

  const days = Object.keys(sessions);
  if (!days.length) {
    return (
      <section className="flex flex-col items-center p-4">
        <h1 className="text-2xl font-semibold mb-4">Session Timetable</h1>
        <span className="text-gray-500">There are no sessions for the next week.</span>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center p-4 w-full max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Session Timetable</h1>

      <div className="flex gap-4 mb-6 w-full">
        <select
          className="select select-bordered flex-1"
          value={locFilter}
          onChange={(e) => setLocFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered flex-1"
          value={actFilter}
          onChange={(e) => setActFilter(e.target.value)}
        >
          <option value="all">All Activities</option>
          {activities.map((act) => (
            <option key={act.id} value={act.id}>
              {act.name}
            </option>
          ))}
        </select>
      </div>

      {days.map((day) => (
        <div key={day} className="w-full mb-8">
          <h2 className="text-xl font-medium mb-4">{day}</h2>
          {Object.entries(sessions[day])
            .filter(([_, slots]) => actFilter === "all" || slots.some(s => s.activity.id.toString() === actFilter))
            .map(([actName, slots]) => (
              <div key={actName} className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{actName}</h3>
                <ul className="space-y-4">
                  {slots.map((slot) => (
                    <li
                      key={slot.session.id}
                      className={`flex justify-between items-center p-4 border rounded-lg shadow-sm transition ${
                        selectedSessionId == slot.session.id ? 'bg-yellow-100' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">
                          {slot.session.start_time}
                        </div>
                        <div className="text-sm text-gray-600">
                          📍 {slot.location.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Trainers: {slot.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const newParams = new URLSearchParams();
                          newParams.append('sessionId', slot.session.id);
                          window.history.pushState({}, '', `?${newParams.toString()}`);
                        }}
                      >
                        View
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





// USE THIS METHOD FOR TIMETABLE AND MY BOOKINGS
// import { useCallback, useEffect, useState } from "react"
// import { FaCoffee, FaSearch } from "react-icons/fa"
// import { fetchAPI } from "../api.mjs"

// function ProductListView() {
//     const [filter, setFilter] = useState("")
//     const [products, setProducts] = useState([])
//     const [error, setError] = useState(null)

//     const getProducts = useCallback(() => {
    //     setProducts([])
    //     setError(null)
//         const request = filter.length > 0
//             ? fetchAPI("GET", "/products?filter=" + filter)
//             : fetchAPI("GET", "/products")

//         request
//             .then(response => {
//                 if (response.status == 200) {
//                     if (response.body.length > 0) {
//                         setProducts(response.body)
//                         setError(null)
//                     } else {
//                         setProducts([])
//                         setError("No results")
//                     }
//                 } else {
//                     setError(response.body.message)
//                 }
//             })
//             .catch(error => {
//                 setError(error)
//             })
//     }, [setProducts, filter])

//     useEffect(() => {
//         getProducts()
//     }, [])

//     return <section className="flex flex-col items-center">
//         <div className="join p-4 self-stretch">
//             <input
//                 value={filter}
//                 onChange={e => setFilter(e.target.value)}
//                 type="text"
//                 className="input join-item grow"
//                 placeholder="search products" />
//             <button
//                 onClick={() => getProducts()}
//                 className="btn join-item">
//                 <FaSearch />
//             </button>
//         </div>
//         {error && <span className="p-4 self-center">{error}</span>}
//         {!error && products.length == 0
//             ? <span className="loading loading-spinner loading-xl"></span>
//             : <ul className="list bg-base-100 self-stretch">
//                 {products.map(product =>
//                     <li key={product.id} className="list-row">
//                         <div>
//                             <FaCoffee className="size-10" />
//                         </div>
//                         <div>
//                             <div>{product.name}</div>
//                             <div className="text-xs uppercase font-semibold opacity-60">${product.price}</div>
//                         </div>
//                         <button className="btn btn-ghost text-xl">
//                             Buy
//                         </button>
//                     </li>
//                 )}
//             </ul>
//         }
//     </section>
// }

// export default ProductListView





// THIS IS CONVERTED FROM THE OLD EJS VIEW 
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { fetchAPI } from "../api.mjs";

// function TimetableView() {
//   const [sessions, setSessions] = useState({});
//   const [locations, setLocations] = useState([]);
//   const [activities, setActivities] = useState([]);
//   const [trainers, setTrainers] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Filters state
//   const [locFilter, setLocFilter] = useState("all");
//   const [actFilter, setActFilter] = useState("all");
//   const [trainerFilterAll, setTrainerFilterAll] = useState("all");
//   const [trainerFilter, setTrainerFilter] = useState("all");

//   // Fetch initial data
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [sessRes, locRes, actRes, trRes] = await Promise.all([
//         fetchAPI("GET", "/sessions"),
//         fetchAPI("GET", "/locations"),
//         fetchAPI("GET", "/activities"),
//         fetchAPI("GET", "/trainers")
//       ]);

//       if (sessRes.status === 200) setSessions(sessRes.body);
//       if (locRes.status === 200) setLocations(locRes.body);
//       if (actRes.status === 200) setActivities(actRes.body);
//       if (trRes.status === 200) setTrainers(trRes.body);

//     } catch (e) {
//       setError("Failed to load data.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   // Helpers: parse and filter next 7 days
//   const parseDate = (dateStr) => {
//     const d = new Date(dateStr);
//     return isNaN(d) ? null : d;
//   };

//   const filteredSessions = useMemo(() => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const weekLater = new Date(today);
//     weekLater.setDate(today.getDate() + 7);
//     let entries = [];

//     Object.entries(sessions).forEach(([dateStr, acts]) => {
//       const date = parseDate(dateStr);
//       if (date && date >= today && date <= weekLater) {
//         Object.values(acts).forEach(arr => entries.push(...arr));
//       }
//     });

//     // apply filters
//     return entries.filter(e => {
//       const matchLoc = locFilter === "all" || e.location.name === locFilter;
//       const matchAct = actFilter === "all" || e.activity.id === actFilter;
//       const matchAll = trainerFilterAll === "all" || e.trainers.map(t=>t.id).includes(trainerFilterAll);
//       const matchOne = trainerFilter === "all" || e.trainers.map(t=>t.id).includes(trainerFilter);
//       return matchLoc && matchAct && matchAll && matchOne;
//     });
//   }, [sessions, locFilter, actFilter, trainerFilterAll, trainerFilter]);

//   if (loading) return (
//     <section className="flex flex-col items-center p-4">
//       <h1 className="text-2xl font-bold mb-4">Session Timetable</h1>
//       <span className="loading loading-spinner loading-xl"></span>
//     </section>
//   );

//   if (error) return (
//     <section className="flex flex-col items-center p-4">
//       <h1 className="text-2xl font-bold mb-4">Session Timetable</h1>
//       <span className="text-red-600">{error}</span>
//     </section>
//   );

//   return (
//     <section className="flex flex-col items-center p-4">
//       <h1 className="text-2xl font-bold mb-4">Session Timetable</h1>

//       {/* Filters */}
//       <div className="flex flex-wrap gap-4 mb-6">
//         <select value={locFilter} onChange={e => setLocFilter(e.target.value)} className="select select-bordered">
//           <option value="all">All Locations</option>
//           {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
//         </select>

//         <select value={actFilter} onChange={e => setActFilter(e.target.value)} className="select select-bordered">
//           <option value="all">All Activities</option>
//           {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//         </select>

//         <select value={trainerFilterAll} onChange={e => setTrainerFilterAll(e.target.value)} className="select select-bordered">
//           <option value="all">All Sessions</option>
//           <option value="mySessions">My Sessions Only</option>
//         </select>

//         <select value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)} className="select select-bordered">
//           <option value="all">All Trainers</option>
//           {trainers.map(t => <option key={t.id} value={t.id}>{`${t.first_name} ${t.last_name}`}</option>)}
//         </select>
//       </div>

//       {/* Sessions List */}
//       {filteredSessions.length === 0 ? (
//         <span className="text-red-600">There are no sessions for the next week.</span>
//       ) : (
//         <ul className="w-full max-w-3xl space-y-4">
//           {filteredSessions.map(entry => (
//             <li key={entry.session.id} className="flex justify-between items-center border p-4 rounded-lg shadow">
//               <div>
//                 <div className="font-semibold text-lg">{entry.activity.name}</div>
//                 <div>Time: {entry.session.start_time}</div>
//                 <div>📍 {entry.location.name}</div>
//                 <div className="space-y-1">
//                   {entry.trainers.map(t => (
//                     <div key={t.id}>👤 {`${t.first_name} ${t.last_name}`}</div>
//                   ))}
//                 </div>
//               </div>
//               <button
//                 onClick={() => { window.location.href = `/booking/book_session/${entry.session.id}`; }}
//                 className="btn btn-primary"
//               >
//                 Book →
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </section>
//   );
// }

// export default TimetableView;


// second attempt, doesnt work 

// import { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router";

// function TimetableView() {
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [sessions, setSessions] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Optional: read selected session ID from query
//   const selectedSessionId = searchParams.get("sessionId");

//   useEffect(() => {
//     async function fetchSessions() {
//       try {
//         setLoading(true);
//         setError(null);
//         const res = await fetch("/api/timetable");
//         if (!res.ok) {
//           const body = await res.json();
//           throw new Error(body.message || "Failed to load sessions");
//         }
//         const data = await res.json();
//         setSessions(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchSessions();
//   }, []);

//   if (loading) {
//     return (
//       <section className="flex flex-col items-center">
//         <span className="loading loading-spinner loading-xl"></span>
//       </section>
//     );
//   }

//   if (error) {
//     return (
//       <section className="flex flex-col items-center">
//         <span className="p-4 text-red-600">{error}</span>
//       </section>
//     );
//   }

//   const days = Object.keys(sessions || {});
//   if (!days.length) {
//     return (
//       <section className="flex flex-col items-center">
//         <h1 className="text-2xl font-semibold p-4">Timetable</h1>
//         <span className="p-4 text-gray-500">There are no sessions for the next week.</span>
//       </section>
//     );
//   }

//   return (
//     <section className="flex flex-col items-center w-full max-w-3xl">
//       <h1 className="text-2xl font-semibold p-4">Session Timetable</h1>
//       {days.map((day) => (
//         <div key={day} className="w-full mb-6">
//           <h2 className="text-xl font-medium mb-2">{day}</h2>
//           {Object.entries(sessions[day]).map(([activityName, slots]) => (
//             <div key={activityName} className="mb-4">
//               <h3 className="text-lg font-semibold mb-1">{activityName}</h3>
//               <ul className="bg-white shadow rounded p-2">
//                 {slots.map((slot) => (
//                   <li
//                     key={slot.session.id}
//                     className={`flex items-center justify-between p-2 border-b last:border-b-0 ${
//                       selectedSessionId == slot.session.id ? 'bg-yellow-100' : ''
//                     }`}
//                   >
//                     <div>
//                       <div className="font-medium">{slot.session.start_time}</div>
//                       <div className="text-sm text-gray-600">{slot.location.name}</div>
//                       <div className="text-sm text-gray-600">Trainers: {slot.trainers.length}</div>
//                     </div>
//                     <button
//                       className="btn btn-sm"
//                       onClick={() => {
//                         // update query string without full navigation
//                         setSearchParams({ sessionId: slot.session.id });
//                       }}
//                     >
//                       View
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>
//       ))}
//     </section>
//   );
// }

// export default TimetableView;