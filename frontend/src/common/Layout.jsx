import { CgProfile } from "react-icons/cg"
import { IoCalendarOutline } from "react-icons/io5";
import { FaRegCalendarAlt } from "react-icons/fa";
import { LuCalendarDays } from "react-icons/lu";
import { VscAccount } from "react-icons/vsc";
import { AiOutlineSchedule } from "react-icons/ai";
import { IoIosLogIn } from "react-icons/io";
import { IoChatbubblesOutline } from "react-icons/io5";
import { Outlet, useLocation, useNavigate } from "react-router"

function Layout() {
    const navigate = useNavigate()
    const location = useLocation()

    return <main className="max-w-[430px] min-h-screen mx-auto shadow">
        <header className="navbar justify-between bg-base-100 shadow-md">
            <button
                onClick={() => navigate("/")}
                className="btn btn-ghost text-lg">
                High Street Gym
                {/* <img src="../img/hsg_logo_322x105.png" alt="High Street Gym Logo" className="h-8" /> */}
            </button>
            <button
                onClick={() => navigate("authenticate")}
                className="btn btn-ghost text-lg">
                <IoIosLogIn />
            </button>
        </header>
        <Outlet />
        <nav className="dock max-w-[430px] mx-auto">
            <button
                onClick={() => navigate("/")}
                className={location.pathname == "/" ? "dock-active" : ""}
            >
                <IoCalendarOutline className="text-2xl" />
                <span className="dock-label">Timetable</span>
            </button>
            <button
                onClick={() => navigate("/booking")}
                className={location.pathname.startsWith("/booking") ? "dock-active" : ""}
            >
                <AiOutlineSchedule className="text-2xl" />
                <span className="dock-label">My Bookings</span>
            </button>
            <button
                onClick={() => navigate("/blog")}
                className={location.pathname.startsWith("/blog") ? "dock-active" : ""}
            >
                <IoChatbubblesOutline className="text-2xl" />
                <span className="dock-label">Blog</span>
            </button>
            <button
                onClick={() => navigate("/profile")}
                className={location.pathname.startsWith("/profile") ? "dock-active" : ""}
            >
                <VscAccount className="text-2xl" />
                <span className="dock-label">Profile</span>
            </button>
        </nav>
    </main>
}

export default Layout

/* <Link to={"/staff/login"}>goto login</Link> */
// function Layout() {
//     const navigate = useNavigate()

//     return <main className="max-w-[430px] min-h-screen mx-auto shadow">
//         <header className="navbar justify-between bg-base-100 shadow-md">
//             <button
//                 onClick={() => navigate("/")}
//                 className="btn btn-ghost text-lg">
//                 Minute Coffee
//             </button>
//             <button
//                 onClick={() => navigate("/staff/login")}
//                 className="btn btn-ghost text-lg">
//                 <FaLock />
//             </button>
//         </header>
//         <Outlet />
//     </main>
// }


// FOR ROLE BASED ACCESS 
/* <button disabled>
<FaClipboardList className="text-2xl" />
<span className="dock-label">Orders</span>
</button> */