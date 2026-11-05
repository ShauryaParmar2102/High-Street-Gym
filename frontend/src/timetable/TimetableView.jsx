
import { useCallback, useEffect, useState } from "react";
import { FaSearch, FaCalendarAlt, FaCalendarTimes } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";

// Displays the gym timetable
function TimetableView() {

// ========== REACT STATE MANAGEMENT ==========
// Stores search filters, session data and booking-related information.
// React updates the interface when these state values change.
    const [filter, setFilter] = useState(""); 
    const [searchTerm, setSearchTerm] = useState("");

    // Store the sessions retrieved from the backend
    const [sessions, setSessions] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    

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

    useEffect(() => {
    if (!isLoggedIn || user?.role !== "member") return;

    fetchAPI("GET", "/bookings", null, localStorage.getItem("auth-key"))
        .then((response) => {
            if (response.status === 200) {
                setBookedSessionIds(
                    response.body.map(b => Number(b.sessionId))
                );
            }
        })
        .catch(console.error);
}, [isLoggedIn, user?.role]);

    // REDIRECT TRAINER AWAY FROM MEMBER TIMETABLE
    useEffect(() => {
        if (user?.role === "trainer") {
            navigate("/session", {
                replace: true,
            });
        }
    }, [user, navigate]);

// ========== GET - FETCH GYM SESSIONS ==========
// Retrieves gym sessions from the backend using a GET request.
// Supports searching sessions using a query parameter.
// Updates React state with the returned session data.
    const getSessions = useCallback(() => {

        // Add the search filter to the request if one has been entered
        const authKey = localStorage.getItem("auth-key");

        setIsLoading(true);
setError(null);


const request =
    searchTerm.length > 0
        ? fetchAPI("GET", "/sessions?filter=" + encodeURIComponent(searchTerm), null, authKey)
        : fetchAPI("GET", "/sessions", null, authKey);

// Handle the response returned by the backend
request
    .then((response) => {

        // Check whether the API request was successful
        if (response.status === 200) {

            // Store the sessions returned by the backend
            // An empty array will trigger the new empty state
            setSessions(Array.isArray(response.body) ? response.body : []);
            setError(null);

        } else {

            // Display an error if the request failed
            setSessions([]);
            setError(response.body?.message || "Failed to load sessions.");
        }
    })
    .catch((error) => {

        // Handle errors that occur during the API request
        setSessions([]);
        setError(error.message || String(error));
    })
    .finally(() => {

        // Stop displaying the loading spinner
        setIsLoading(false);
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

// ========== POST - CREATE SESSION BOOKING ==========
// Sends the selected session ID to the booking API.
// Includes the authentication key to identify the logged-in user.
// Displays booking errors or redirects after successful booking.
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

    {/* Timetable icon */}
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
        <FaCalendarAlt className="text-2xl text-[#452078]" />
    </div>

    {/* Page title */}
    <h1 className="text-3xl font-bold text-[#452078]">
        Gym Timetable
    </h1>

    {/* Page description */}
    <p className="mt-2 text-sm text-neutral-600">
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

    
{/* Error Message */}
{!isLoading && error && (
    <div
        role="alert"
        className="w-full max-w-4xl rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700 shadow-sm"
    >
        {error}
    </div>
)}

    
{/* Loading State */}
{isLoading && (
    <div className="flex w-full justify-center p-8">
        <span className="loading loading-spinner loading-lg text-[#452078]" />
    </div>
)}

{/* Empty State */}
{!isLoading && !error && sessions.length === 0 && (
    <div className="w-full max-w-4xl rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">

        {/* Calendar Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <FaCalendarTimes className="text-3xl text-[#452078]" />
        </div>

        {/* Empty State Heading */}
        <h2 className="text-xl font-bold text-[#452078]">
            {searchTerm ? "No Matching Sessions" : "No Sessions Available"}
        </h2>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            {searchTerm
                ? "No gym sessions match your search. Try another activity or location."
                : "There are currently no gym sessions available."}
        </p>

        {/* Clear Search Button */}
        {searchTerm && (
            <button
                type="button"
                onClick={() => {
                    setFilter("");
                    setSearchTerm("");
                }}
                className="btn mt-5 rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
            >
                Clear Search
            </button>
        )}
    </div>
)}

{/* Session Cards */}
{!isLoading && !error && sessions.length > 0 && (
    <ul className="flex w-full max-w-4xl flex-col gap-4">

            {sessions.map((session) => (
                <li
                    key={session.session_id}
                    className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
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
    bookedSessionIds.includes(Number(session.session_id)) ? (
<span className="flex w-full items-center justify-center rounded-lg border border-green-300 bg-green-100 px-4 py-3 font-semibold text-green-800">
    ✓ Booked
</span>
    ) : (
        <button
            onClick={() => handleConfirm(session)}
            disabled={isPastSession(session)}
            className="btn w-full rounded-lg border-[#452078] bg-[#452078] text-white hover:border-[#65429a] hover:bg-[#65429a] disabled:cursor-not-allowed disabled:opacity-40"
        >
            {isPastSession(session)
                ? "Session Unavailable"
                : isLoggedIn
                    ? "Book Session"
                    : "Login to Book"}
        </button>
    )
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
                    {new Date(selectedSession.session_date).toLocaleDateString("en-AU", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        timeZone: "Australia/Brisbane"
                    })}
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
