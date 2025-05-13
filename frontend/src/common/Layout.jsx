import { IoCalendarOutline } from "react-icons/io5";
import { VscAccount } from "react-icons/vsc";
import { AiOutlineSchedule } from "react-icons/ai";
import { IoChatbubblesOutline } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import { Outlet, useLocation, useNavigate } from "react-router"
import { useAuthenticate } from "../authentication/useAuthenticate"

function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const {user, logout} = useAuthenticate()
//// PRIVACY POLICY LINK???
    return <main className="max-w-[430px] min-h-screen mx-auto shadow">
        <header className="navbar justify-between bg-base-100 shadow-md">
            <button
                onClick={() => navigate("/")}
                className="btn btn-ghost text-lg">
                High Street Gym
            </button>
            {user
                    ? <button
                        onClick={() => logout()}
                        className="btn btn-ghost text-xl">
                        <TbLogout />
                    </button>
                    : <button
                        onClick={() => navigate("/authenticate")}
                        className="btn btn-ghost text-xl">
                        Login
                    </button>}
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
