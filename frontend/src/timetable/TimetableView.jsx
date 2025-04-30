import { FaLock } from "react-icons/fa"
import { CgProfile } from "react-icons/cg";

function TimetableView() {
    return <section className="max-w-[430px] min-h-screen mx-auto shadow">
        <header className="navbar justify-between bg-base-100 shadow-md">
            <button className="btn btn-ghost text-lg">
                Minute Coffee
            </button>
            <button className="btn btn-ghost text-lg">
                <CgProfile />
            </button>
        </header>
        <h1>Timetable</h1>
    </section>
}

export default TimetableView