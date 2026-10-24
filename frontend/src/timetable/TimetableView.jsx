
import { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";

// Displays the gym timetable
function TimetableView() {

    // Store the search filter entered by the user
    const [filter, setFilter] = useState(""); 
    const [searchTerm, setSearchTerm] = useState("");

    // Store the sessions retrieved from the backend
    const [sessions, setSessions] = useState([]);

    // Check whether a gym session has already started
const isPastSession = (session) => {
    const date = new Date(session.session_date);

    const [hours, minutes] = session.start_time.split(":").map(Number);

    date.setHours(hours, minutes, 0, 0);

    return date < new Date();
};

    // Store any errors that occur when loading sessions
    const [error, setError] = useState(null);

    // Store the IDs of sessions already booked by the member
const [bookedSessionIds, setBookedSessionIds] = useState([]);
    
    // Allows the user to be redirected to another page
    const navigate = useNavigate();

    //Get the currently authenticated user
    const { user } = useAuthenticate();

    // Check whether an authentication key exists in local storage
    const isLoggedIn = Boolean(localStorage.getItem("auth-key"));

    // REDIRECT TRAINER AWAY FROM MEMBER TIMETABLE
    useEffect(() => {
        if (user?.role === "trainer") {
            navigate("/session", {
                replace: true,
            });
        }
    }, [user, navigate]);

     // Fetch gym sessions from the backend API
    const getSessions = useCallback(() => {

        // Add the search filter to the request if one has been entered
        const authKey = localStorage.getItem("auth-key");

const request =
    searchTerm.length > 0
        ? fetchAPI("GET", "/sessions?filter=" + encodeURIComponent(searchTerm), null, authKey)
        : fetchAPI("GET", "/sessions", null, authKey);

        // Handle the response returned by the backend
        request
            .then((response) => {

                 // Check whether the request was successful
                if (response.status === 200) {

                    // Store the sessions if the API returned results
                    if (response.body.length > 0) {
                        setSessions(response.body);
                        setError(null);
                    } else {

                        // Clear the sessions and display a message if none were found
                        setSessions([]);
                        setError("No sessions found.");
                    }
                } else {

                     // Display an error message if the request was unsuccessful
                    setError(response.body?.message || "Failed to load sessions");
                }
            })
            .catch((error) => {

                // Handle errors that occur while making the API request
                setError(error.message || String(error));
            });

    }, [searchTerm]);

    // Load sessions when the page opens or the search filter changes
    useEffect(() => {
        getSessions();
    }, [getSessions]);

    const [selectedSession, setSelectedSession] = useState(null);  // Store the session selected by the user for booking
    const [isBooking, setIsBooking] = useState(false);  // Track whether a booking request is currently being processed
    const [bookingError, setBookingError] = useState(null); // Store any errors that occur when booking a session

     // Handle the user selecting a session to book
    const handleConfirm = (session) => {
        const authKey = localStorage.getItem("auth-key"); // Retrieve the authentication key from local storage

        // Redirect the user to login if they are not authenticated
        if(!authKey) {
            navigate("/login");
            return;
        }
        // Clear previous booking errors and store the selected session
        setBookingError(null);
        setSelectedSession(session);
    };
    // Close the booking confirmation and clear any booking errors
    const handleCancel = () => {
        setSelectedSession(null);
        setBookingError(null);
    };

     // Send a booking request for the selected gym session
    const handleBookSession = () => {

          // Stop if the user has not selected a session
        if(!selectedSession) {
            return;
        }

        const authKey = localStorage.getItem("auth-key"); // Retrieve the authentication key before making the booking

          // Redirect unauthenticated users to the login page
        if(!authKey) {
            navigate("/login");
            return;
        }

        // Mark the booking as processing and clear previous errors
        setIsBooking(true);
        setBookingError(null);

        // Send the selected session ID to the backend API
        fetchAPI(
            "POST",
            "/bookings",
            {
                sessionId: selectedSession.session_id,
            },
            authKey,
        )
        .then((response) => {

            // Check whether the booking was created successfully
            if (response.status === 200 || response.status == 201) {

                 // Clear the selected session and open the bookings page
                setSelectedSession(null);
                navigate("/bookings");
            } else {

                  // Display an error message if the booking failed
                setBookingError(
                    response.body?.message ||
                    "Failed to book session"
                );
            }
        })
        .catch((error) => {

              // Handle errors that occur during the booking request
            setBookingError(error.message || String(error));
        })
        .finally(() => {
            // Reset the booking state after the request finishes
            setIsBooking(false)
        });
    };

    return(
        <section className="flex min-h-screen flex-col items-center bg-[#f5f5f5] px-3 pt-5 pb-24 text-neutral-900">

            {/* Page heading */}
            <div className="mb-6 w-full max-w-4xl rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
                <h1 className="text-3xl font-bold text-neutral-900">
                    Gym Timetable
                </h1>

                <p className="mt-1 text-sm text-neutral-600">
                    Browse and book your favourite gym sessions.
                </p>
            </div>

            {/* SEARCH BAR */}
            <div className="mb-5 flex h-[62px] w-full max-w-4xl items-center gap-2 self-stretch rounded-lg border border-neutral-300 bg-[#f8f8f8] p-[5px]">
            <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                type="text"
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-lg font-medium text-neutral-900 outline-none placeholder:text-neutral-500 focus:outline-none"
                placeholder="Search gym sessions..."
        ></input>
        
        <button
            onClick={() => setSearchTerm(filter.trim())}
            className="flex h-[52px] w-[60px] shrink-0 items-center justify-center rounded-md border-0 bg-[#7036D5] text-white shadow-none transition-colors hover:bg-[#5C2DB0] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
            <FaSearch />
        </button>
    </div>

    {/* ERROR */}
    {error && (
        <span className="w-full rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600 shadow-sm">

            {error}
        </span>
    )}

    {/* SESSIONS */}
    {!error && sessions.length == 0 ? (
        <span className="loading loading-spinner loading-xl"></span>
    ) : (
        <ul className="flex w-full max-w-4xl flex-col gap-4">
            {sessions.map((session) => (
                <li
                    key={session.session_id}
                    className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-md"
                >
                    <div className="min-w-0 space-y-2">
                        <div className="text-lg font-bold text-neutral-900">
                            {session.activity_name}
                        </div>

                        <div className="text-sm font-semibold capitalize text-neutral-700">
                            {session.location_name?.toLowerCase()}
                        </div>

                        <div className="text-sm text-neutral-700">
    {new Date(session.session_date).toLocaleDateString("en-AU", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Australia/Brisbane"
    })}
</div>

                        <div className="text-sm text-neutral-700">
                            {session.start_time} - {session.end_time}
                        </div>

                        <div className="text-sm text-neutral-700">
                            Trainer: {session.trainer_name}
                        </div>

                        <div className="text-sm text-neutral-700">
                            Capacity: {session.capacity} 
                        </div>
                    </div>

    {/* Hide the booking button for trainers, as only members can book gym sessions */}
    {user?.role !== "trainer" && (
    <button
        onClick={() => handleConfirm(session)}
        // Disable booking button for sessions that have already started or from the past
        disabled={isPastSession(session)}
        className="btn w-full rounded-lg border-[#452078] bg-[#452078] text-white hover:border-[#65429a] hover:bg-[#65429a] disabled:cursor-not-allowed disabled:opacity-40"
    >
        {isPastSession(session)
            ? "Session Unavailable"
            : isLoggedIn
                ? "Book Session"
                : "Login to Book"}
    </button>
)}
                    </li>
        ))}
        </ul>
    )}

    {/* BOOKING MODAL */}
    {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-[350px] rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl">
                <h3 className="font-bold text-lg">
                    Confirm Booking
                </h3>

                <p className="py-4">
                   Do you want to book this session?
                </p>

                <div className="py-2">
                    <p className="font-bold">
                        {selectedSession.activity_name}
                    </p>

                    <p className="text-sm opacity-70">
                        {selectedSession.session_date} (
                            {new Date(selectedSession.session_date).toLocaleDateString("en-AU", {
                                weekday: "long",
                                timeZone: "Australia/Brisbane"
                            })})
                    </p>

                    <p className="text-sm opacity-70">
                        {selectedSession.start_time} -{" "}
                        {selectedSession.end_time}
                    </p>

                    <p className="text-sm opacity-70">
                        Location: {selectedSession.location_name}
                    </p>

                    <p className="text-sm opacity-70">
                        Trainer: {selectedSession.trainer_name}
                    </p>

                    <p className="text-sm opacity-70">
                        Capacity: {selectedSession.capacity}
                    </p>
                </div>

                 {/* BOOKING ERROR */}
                 {bookingError && (
                    <p className="text-error font-semibold text-sm py-2">
                        {bookingError}
                    </p>
                 )}

                 <div className="modal-action">
                    <button
                        className="btn rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                        onClick={handleCancel}
                        disabled={isBooking}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn rounded-lg border-[#452078] bg-[#452078] text-white hover:border-[#65429a] hover:bg-[#65429a]"
                        onClick={handleBookSession}
                        disabled={isBooking}
                    >
                        {isBooking ? (
                            <span className="loading loading-spinner"></span>
                        ) : (
                            "Confirm Booking"
                        )}
                    </button>
                 </div>
            </div>
        </div>
    )}
        
        </section>
    )


}

export default TimetableView;
