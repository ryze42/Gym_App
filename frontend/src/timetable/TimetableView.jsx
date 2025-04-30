import { useNavigate } from "react-router"

function TimetableView() {
    const navigate = useNavigate()

    return <section className="flex flex-col items-center">
        <h1>timetable</h1>
        <span className="p-4" style={{ color: '#c5003c' }}>There are no sessions for the next week.</span>
        {/* <span className="loading loading-spinner loading-xl"></span> */}
    </section>
}

export default TimetableView


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
