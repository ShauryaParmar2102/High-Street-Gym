import {useState, useCallback, useEffect} from "react";
import {useNavigate} from "react-router";
import {fetchAPI} from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";

function BookingView() {

    // Used to navigate between pages
    const navigate = useNavigate();

      // Stores the user's bookings
    const [bookings, setBookings] = useState([]);

    // Stores session details such as activity, trainer, location and time
const [sessions, setSessions] = useState([]);

    // Stores any error messages
    const [error, setError] = useState(null);

    // Tracks whether bookings are loading
    const [isLoading, setIsLoading] = useState(true);

    // Tracks which booking is being cancelled
    const [cancelling, setCancelling] = useState(null);

    // Retrieve the user's bookings and related session details from the API
    const getBookings = useCallback(async () => {
        const authKey = localStorage.getItem("auth-key");

        // Redirect to login if the user is not authenticated
        if(!authKey) {
            navigate("/login");
            return;
        }

        try {
            // Start loading the user's bookings
                setIsLoading(true);

            // Clear any previous errors
            setError(null);

            // Send a GET request to retrieve the user's bookings
            const response = await fetchAPI(
                "GET",
                `/bookings`,
                null,
                authKey
            );

            // Check if the bookings could not be retrieved
            if (response.status !== 200) {
                throw new Error(
                    response.body?.message ||
                    "Unable to load bookings"
                );
            }

            // Store the bookings returned by the backend
setBookings(response.body);

// Retrieve session details for the user's bookings
const sessionResponse = await fetchAPI(
    "GET",
    "/sessions",
    null,
    authKey
);

// Check if the sessions were retrieved successfully
if (sessionResponse.status !== 200) {
    throw new Error(
        sessionResponse.body?.message ||
        "Unable to load session details"
    );
}

// Store the session information
setSessions(sessionResponse.body);

       } catch (err) {
    setError(err.message || String(err));
} finally {
    // Add a short 100ms delay before hiding the loading spinner
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Stop displaying the loading spinner
    setIsLoading(false);
}
}, [navigate]);


    // Cancel a booking selected by the user
    const cancelBooking = async (bookingId) => {
        const authKey = localStorage.getItem("auth-key");

        try {
            // Track which booking is being cancelled
            setCancelling(bookingId);

            // Clear previous errors
            setError(null);

            // Send a DELETE request to cancel the booking
            const response = await fetchAPI(
                "DELETE",
                `/bookings/${bookingId}`,
                null,
                authKey
            );

            // Check if the cancellation failed
            if (response.status !== 200) {
                throw new Error(
                    response.body?.message ||
                    "Unable to cancel booking"
                );
            }

            // Remove only the cancelled booking from the displayed list
setBookings((previousBookings) =>
    previousBookings.filter(
        (booking) => Number(booking.id) !== Number(bookingId)
    )
);

        } catch (err) {
            setError(err.message || String(err));
        } finally {
            // Reset the cancelling state
            setCancelling(null);
        }
    };

    // Load the user's bookings when the page opens
useEffect(() => {
    getBookings();
}, [getBookings]);

// Testing GitHub updates
return (
<section className="min-h-screen bg-[#f5f5f5] text-neutral-900 px-4 sm:px-6 lg:px-8 py-6 pb-28">

    {/* Page heading */}
<div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
    <h1 className="text-3xl font-bold text-neutral-900">
        My Bookings
    </h1>
    <p className="text-sm text-black-400 mt-1">
        View and manage your scheduled gym sessions.
    </p>
</div>

{/* MEMBER XML */}
<div className="mb-4 w-full">
    <XMLDownloadButton
        route="/bookings/xml"
        authenticationKey={localStorage.getItem("auth-key") || ""}
        filename="members.xml"
    className="h-12 w-full rounded-lg border border-[#452078] bg-white px-5 font-semibold text-[#452078] shadow-sm hover:bg-purple-50 cursor-pointer"
    >
        Export Previous Bookings (XML)
    </XMLDownloadButton>
</div>

    {/* Show a loading spinner while bookings are loading */}
    {isLoading ? (
        <div className="flex justify-center">
            <span className="loading loading-spinner loading-xl"></span>
        </div>
    ) : error ? (
        // Display an error message if something goes wrong
        <p className="text-error font-semibold">
            {error}
        </p>
        ) : bookings.length === 0 ? (
                // Display a message if the user has no bookings
            <p className="opacity-60">
                You don't have any bookings yet
            </p>
        ) : (
            // Display the user's bookings in a list
            <ul className="flex flex-col gap-4">

    {/* Loop through each booking */}
{bookings.map((booking) => {
    // Find the session details matching this booking
    const session = sessions.find(
        (item) => Number(item.session_id) === Number(booking.sessionId)
    );

    return (
        <li
            key={booking.id}
             className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm transition-colors hover:border-neutral-300"
        >
            <div>
                {/* Display the activity name */}
                <div className="font-bold text-neutral-900">
                    {session?.activity_name || `Session #${booking.sessionId}`}
                </div>

                {/* Display the gym location */}
                <div className="text-sm">
                    Location: {session?.location_name || "Unavailable"}
                </div>

                {/* Display the session date */}
                <div className="text-sm opacity-70">
                    Date: {session?.session_date
                        ? new Date(session.session_date).toLocaleDateString("en-AU")
                        : "Unavailable"}
                </div>

                {/* Display the session time */}
                <div className="text-sm opacity-70">
                    Time: {session?.start_time || "-"} - {session?.end_time || "-"}
                </div>

                {/* Display the trainer */}
                <div className="text-sm opacity-70">
                    Trainer: {session?.trainer_name || "Unavailable"}
                </div>

                {/* Display the booking status */}
                <div className="text-sm font-semibold text-green-700">

                    Status: {booking.bookingStatus}
                </div>

                {/* Display when the booking was made */}
                <div className="text-sm opacity-70">
                    Booked: {new Date(booking.bookedAt).toLocaleDateString("en-AU")}
                </div>
            </div>

            {/* Cancel only the selected booking */}
            <button
                className="btn min-w-24 rounded-lg border-red-600 bg-red-600 px-4 font-semibold text-white hover:border-red-700 hover:bg-red-700 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
                onClick={() => cancelBooking(booking.id)}
                disabled={cancelling === booking.id}
            >
                {cancelling === booking.id ? (
                    <span className="loading loading-spinner"></span>
                ) : (
                    "Cancel"
                )}
            </button>
        </li>
    );
})}
</ul>
)}
</section>
); 
}

export default BookingView;
