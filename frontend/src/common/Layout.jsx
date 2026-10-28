import { FaDumbbell, FaCalendarAlt, FaCalendarCheck, FaBlog, FaUser, FaLock } from "react-icons/fa";
import { TbLogin } from "react-icons/tb";
import { FaHome } from "react-icons/fa"; // Imports the Home icon
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const {user, logout} = useAuthenticate();

    //Redirect user back to Login
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isTrainer = user?.role === "trainer"; // Checks if the logged-in user is a trainer

    const isMember = user?.role === "member"; // Checks if the logged-in user is a member

    //Change the timetable label for trainers
    const timetableLabel = isTrainer ? "My Sessions" : "Timetable";

//Check whether the timetable dock item is active
const isTimetableActive = isTrainer
? location.pathname === "/session" 
: location.pathname === "/timetable" ||
location.pathname === "/";

return (
<main className="max-w-[750px] min-h-dvh mx-auto shadow">
<header className="sticky top-0 z-50">
<div className="navbar flex h-16 w-full items-center justify-between gap-1 bg-[#452078] px-2 shadow-sm sm:h-20 sm:gap-2 sm:px-4">
    <button
        type="button"
        onClick={() => navigate("/")}
        className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/10 sm:gap-3 sm:px-2 sm:py-2"
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white sm:h-12 sm:w-12">

    <FaDumbbell className="text-3xl" />
</span>

<span className="flex flex-col">
    <span className="text-xl font-bold leading-tight text-white">
        High Street Gym
    </span>
    <span className="text-[9px] font-medium tracking-wide text-purple-200 sm:text-xs sm:tracking-widest">
        FITNESS & TRAINING
    </span>
</span>
        </button>

        {user ? (
            <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 text-[#452078] shadow-sm transition-colors hover:bg-purple-100"
                aria-label="Logout"
            >
                <FaLock size={20} className="shrink-0" />
                <span className="text-sm font-semibold">Logout</span>
            </button>
            ) : (
            <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 text-[#452078] shadow-sm transition-colors hover:bg-purple-100"
                aria-label="Login"
                >
                    <FaHome size={18} /> {/* Displays the Home icon */}
                    <span className="text-sm font-semibold">Home</span>
                </button>
            )}
</div>
</header>

{/* Page content */}
<div
    className={
        ["/login", "/register"].includes(location.pathname)
            ? ""
            : "pb-24"
    }
>
    <Outlet />
</div>

{/* Navigation bar at the bottom of the page */}
<nav className="dock fixed bottom-0 left-1/2 z-50 h-24 w-full max-w-[750px] -translate-x-1/2 gap-2.5 border-t border-purple-400/30 bg-[#452078] text-white [&_.dock-active]:bg-[#65429a] [&_.dock-active]:text-white">
    <button
        type="button"
        onClick={() => {
            navigate(isTrainer ? "/session" : "/timetable")
        }}
        className={isTimetableActive ? "dock-active" : ""}
        aria-current={isTimetableActive ? "page" : undefined}
        >
            <FaCalendarAlt className="text-3xl" />
            <span className="dock-label">
                {timetableLabel}
            </span>
        </button>

        <button
            type="button"
            onClick={() => navigate("/blog")}
            className={
                location.pathname.startsWith("/blog")
                ? "dock-active"
                : ""
            }
            aria-current={
                location.pathname.startsWith("/blog")
                ? "page"
                : undefined
            }
            >
            <FaBlog className="text-3xl" />
                <span className="dock-label">Blog</span>
            </button>

                {/* Bookings are hidden for trainers */}
                {!isTrainer && (
                    <button
                        type="button"
                        disabled={!isMember} // Disable the button if the user is not a member
                        onClick={() => navigate("/bookings")} // Navigate to the bookings page when clicked

                         // Highlight the button when on the bookings page
                        className={
                            `${location.pathname.startsWith("/bookings") ? "dock-active" : ""} ${
                                !isMember ? "!text-purple-300 !opacity-100" : "!text-white"
                            }`
                        }

                        // Mark the bookings page as the current page
                        aria-current= {
                            location.pathname.startsWith("/bookings")
                                ? "page"
                                : undefined
                        }
                    >

                        {/* Display the bookings icon and label */}
                        <FaCalendarCheck  className="text-3xl" />
                        <span className="dock-label">Bookings</span>
                    </button>
                    )}
                    
                    {/* Profile navigation button */}
                    <button
                        type="button"
                        disabled={!user} // Disable the button if the user is not logged in

                        // Navigate to the user's profile page
                        onClick={() => navigate("/user/self")} 

                        // Highlight the button when viewing the profile
                        className={
                            `${location.pathname.startsWith("/user/self") ? "dock-active" : ""} ${
                                !user ? "!text-purple-300 !opacity-100" : "!text-white"
                            }`
                        }

                        // Mark the profile page as the current page
                        aria-current={
                            location.pathname.startsWith("/user/self")
                                ? "page"
                                : undefined
                        }
                        >
                            {/* Display the profile icon and label */}
                            <FaUser className="text-3xl" />
                            <span className="dock-label">Profile</span>
                        </button>           
                    </nav>
                </main>
            );
        }

        export default Layout;