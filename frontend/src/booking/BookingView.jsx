import { FaLock } from "react-icons/fa"
import { CgProfile } from "react-icons/cg";

function BookingView() {
    return <section className="max-w-[430px] min-h-screen mx-auto shadow">
        <header className="navbar justify-between bg-base-100 shadow-md">
            <button className="btn btn-ghost text-lg">
                High Street Gym
            </button>
            <button className="btn btn-ghost text-lg">
                <FaLock />
            </button>
        </header>
        <h1>book a session</h1>
    </section>
}

export default BookingView