import { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes, FaTrash } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";

/**
 * MySessionsView
 *
 * Displays and manages gym sessions belonging to the logged-in trainer.
 * Uses React state to manage session data, forms, loading and error messages.
 *
 * Communicates with the Express REST API to:
 * - GET the trainer's sessions, activities and locations.
 * - POST new gym sessions.
 * - PUT updates session details.
 * - DELETE removes existing sessions.
 *
 * Uses authentication keys to access protected API endpoints.
 */

function MySessionsView() {
  const [sessions, setSessions] = useState([]);   // Store the trainer's gym sessions

  const [filter, setFilter] = useState("");   // Store the search filter for finding sessions

  const [searchTerm, setSearchTerm] = useState("");

  const [error, setError] = useState(null);   // Store any error messages

  const [success, setSuccess] = useState(null);   // Store success messages after completing an action

  const [isLoading, setIsLoading] = useState(true);   // Track whether sessions are being loaded

  const [isRefreshing, setIsRefreshing] = useState(false);
const sessionsLoaded = useRef(false);
  

  const [isSaving, setIsSaving] = useState(false);   // Track whether a session is currently being saved

    // Store the session currently being edited
  // Null means no session is being edited
  const [editingSession, setEditingSession] = useState(null); 

  // Store the values for editing an existing session
const [editForm, setEditForm] = useState({
  activityId: "",
  locationId: "",
  date: "",
  startTime: "",
  endTime: "",
  capacity: "",
});

  // Controls whether the Create Session form is visible
const [isCreating, setIsCreating] = useState(false);

    // Store the details of the new session
const [createForm, setCreateForm] = useState({
  activityId: "",
  locationId: "",
  date: "",
  startTime: "",
  endTime: "",
  capacity: 20,
});

// Store available activities and locations
const [activities, setActivities] = useState([]);
const [locations, setLocations] = useState([]);

/**
 * Updates the Create Session form when an input value changes.
 *
 * Retrieves the name and value from the input element.
 * Updates the corresponding property in the createForm state
 * while preserving the other form values.
 *
 * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} event
 * The input or select change event.
 * @returns {void}
 */
const handleCreateChange = (event) => {
  const { name, value } = event.target;

  setCreateForm((previousForm) => ({
    ...previousForm,
    [name]: value,
  }));
};

/**
 * Handles the creation of a new gym session.
 *
 * Prevents the default form submission behaviour.
 * Checks whether the trainer has an authentication key.
 * Validates the session times and capacity before submission.
 *
 * Sends a POST request to /api/sessions containing the
 * new session details and the trainer's authentication key.
 *
 * If successful, resets the form, closes the modal,
 * displays a success message and reloads the session list.
 *
 * @async
 * @param {React.SubmitEvent<HTMLFormElement>} event - The form submission event.
 * @returns {Promise<void>}
 */
const handleCreateSession = async (event) => {
  event.preventDefault();

  const authKey = localStorage.getItem("auth-key");

  if (!authKey) {
    setError("Please log in to create a session.");
    return;
  }

  if (createForm.startTime >= createForm.endTime) {
    setError("The end time must be after the start time.");
    return;
  }

  if (
    !Number.isInteger(Number(createForm.capacity)) ||
    Number(createForm.capacity) < 1
  ) {
    setError("Capacity must be a whole number greater than 0.");
    return;
  }

  setIsSaving(true);
  setError(null);
  setSuccess(null);

  try {
    /**
     * Sends a POST request to /api/sessions to create a new gym session
     * using the form data and the trainer's authentication key.
     */
    const response = await fetchAPI(
      "POST",
      "/sessions",
      {
        activityId: Number(createForm.activityId),
        locationId: Number(createForm.locationId),
        date: createForm.date,
        startTime: createForm.startTime,
        endTime: createForm.endTime,
        capacity: Number(createForm.capacity),
      },
      authKey
    );

    if (response.status === 201) {
      setIsCreating(false);

      setCreateForm({
        activityId: "",
        locationId: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: 20,
      });

      setSuccess("Session created successfully.");
      getSessions();
    } else {
      setError(response.body?.message || "Failed to create session.");
    }
  } catch (err) {
    setError(err.message || "Failed to create session.");
  } finally {
    setIsSaving(false);
  }
};

  /**
 * Retrieves the authenticated trainer's gym sessions.
 *
 * Sends a GET request to /api/sessions/trainer using
 * the authentication key stored in localStorage.
 *
 * Converts the nested API response into a simplified
 * session object containing activity, location, trainer,
 * date, time and capacity information.
 *
 * Updates React state with the formatted sessions.
 * Handles loading states and API errors.
 *
 * @returns {void}
 */
  const getSessions = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");

    if(!authKey) {
      setError("Please log in to view your sessions.");
       setIsLoading(false);
       return;
    }

    if (sessionsLoaded.current) {
  setIsRefreshing(true);
} else {
  setIsLoading(true);
}

setError(null);

    // Fetch gym sessions from the API
const request = fetchAPI(
  "GET",
  "/sessions/trainer",
  null,
  authKey
);
  request
  .then(async (response) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (response.status === 200) {
      
      console.log("API SESSION DATES:", response.body);

      const formattedSessions = Array.isArray(response.body)
        ? response.body.map((item) => ({
            session_id: item.session?.id,

            // Activity details
            activity_id: item.activity?.id,
            activity_name: item.activity?.name,

            // Location details
            location_id: item.location?.id,
            location_name: item.location?.name,

            trainer_name: `${item.user?.firstName ?? ""} ${item.user?.lastName ?? ""}`.trim(),
            session_date: item.session?.sessionDate,
            start_time: item.session?.startTime,
            end_time: item.session?.endTime,
            capacity: item.session?.capacity,
          }))
        : [];

        // Store the formatted trainer sessions in React state
    setSessions(formattedSessions);
        } else {
          // Display an error message if the API request was unsuccessful
          setError(response.body?.message || "Failed to load sessions.");
        }
      })
      .catch((err) => {
        // Handle errors that occur while fetching sessions
        setError(err.message || "Failed to load sessions.");
      })
      .finally(() => {
  sessionsLoaded.current = true;
  setIsLoading(false);
  setIsRefreshing(false);
});
  // Empty dependency array prevents the callback from being recreated when the search input changes  
  }, []);

  /**
 * Retrieves all available gym activities from the REST API.
 *
 * Sends a GET request to /api/sessions/activities.
 * Stores the returned activities in React state.
 *
 * The activity data is used to populate dropdown menus
 * in the Create Session and Edit Session forms.
 *
 * @async
 * @returns {Promise<void>}
 */
const getActivities = async () => {
  const authKey = localStorage.getItem("auth-key");

  try {
     /**
     * Sends a GET request to /api/sessions/activities to retrieve
     * available gym activities for the Create and Edit Session forms.
     */
    const response = await fetchAPI(
      "GET",
      "/sessions/activities",
      null,
      authKey
    );

    if (response.status === 200) {
      setActivities(response.body);
    } else {
      setError(response.body?.message || "Failed to load activities.");
    }
  } catch (err) {
    setError(err.message || "Failed to load activities.");
  }
};

/**
 * Retrieves all available gym locations from the REST API.
 *
 * Sends a GET request to /api/sessions/locations.
 * Stores the returned locations in React state.
 *
 * The location data is used to populate dropdown menus
 * in the Create Session and Edit Session forms.
 *
 * @async
 * @returns {Promise<void>}
 */
const getLocations = async () => {
  const authKey = localStorage.getItem("auth-key");

  try {
    /**
     * Sends a GET request to /api/sessions/locations to retrieve
     * available gym locations for the Create and Edit Session forms.
     */
    const response = await fetchAPI(
      "GET",
      "/sessions/locations",
      null,
      authKey
    );

    if (response.status === 200) {
      setLocations(response.body);
    } else {
      setError(response.body?.message || "Failed to load locations.");
    }
  } catch (err) {
    setError(err.message || "Failed to load locations.");
  }
};

/**
 * Loads the trainer's sessions when the component mounts
 * and whenever the getSessions callback changes.
 *
 * Uses the getSessions function to retrieve updated
 * session data from the REST API.
 */
useEffect(() => {
  // Load sessions when the page opens
  getSessions();

  // Automatically check for updated sessions every 10 seconds
  const interval = setInterval(() => {
    getSessions();
  }, 10000);

  // Stop checking when the component unmounts
  return () => clearInterval(interval);
}, [getSessions]);

/**
 * Loads available gym activities and locations
 * when the component first mounts.
 *
 * These values are used to populate the dropdown
 * menus in the Create and Edit Session forms.
 */
useEffect(() => {
  // Retrieve all available gym activities
  getActivities();

  // Retrieve all available gym locations
  getLocations();
}, []);


/**
 * Opens the Edit Session modal for the selected gym session.
 *
 * Stores the selected session in editingSession state.
 * Populates the edit form with the session's existing details.
 *
 * Formats the session date and times into values
 * compatible with HTML date and time inputs.
 *
 * @param {Object} session - The gym session selected for editing.
 * @returns {void}
 */
const handleEdit = (session) => {
    setError(null);
    setSuccess(null);
    setEditingSession(session);

    setEditForm({
  activityId: session.activity_id ?? "",
  locationId: session.location_id ?? "",

  date: session.session_date
    ? new Date(session.session_date).toLocaleDateString("en-CA", {
        timeZone: "Australia/Brisbane",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "",

  startTime: session.start_time
    ? String(session.start_time).substring(0, 5)
    : "",

  endTime: session.end_time
    ? String(session.end_time).substring(0, 5)
    : "",

  capacity: session.capacity ?? "",
});
};
  /**
 * Updates the Edit Session form when an input value changes.
 *
 * Retrieves the name and value from the input element.
 * Updates the corresponding property in editForm state
 * while preserving all other form values.
 *
 * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} event
 * The input or select change event.
 * @returns {void}
 */
  const handleFormChange = (event) => {
    const {name, value} = event.target;

        setEditForm((previousForm) => ({
        ...previousForm,
        [name]: value,
      }));
    };

    /**
 * Closes the Edit Session modal without saving changes.
 *
 * Prevents the modal from closing while a save operation
 * is in progress.
 *
 * Clears the selected session and any existing error message.
 *
 * @returns {void}
 */
    const handleCancelEdit = () => {
      if(isSaving) return;

      setEditingSession(null);
      setError(null);
    };
    
    /**
 * Handles updating an existing gym session.
 *
 * Prevents the default form submission behaviour.
 * Checks that a session is selected and the trainer
 * has an authentication key.
 *
 * Validates all required fields, session times and capacity.
 *
 * Sends a PUT request to /api/sessions/:id containing
 * the complete updated session details.
 *
 * If successful, closes the Edit Session modal,
 * displays a success message and refreshes the session list.
 *
 * @async
 * @param {React.SubmitEvent<HTMLFormElement>} event - The form submission event.
 * @returns {Promise<void>}
 */
    const handleSaveEdit = async (event) => {
      event.preventDefault();

      if(!editingSession) return;
      const authKey = localStorage.getItem("auth-key");

      if(!authKey) {
        setError("Please log in to update your sessions.");
        return;
      }

      if (
        !editForm.activityId ||
        !editForm.locationId ||
        !editForm.date ||
        !editForm.startTime ||
        !editForm.endTime ||
        editForm.capacity === ""
      ) {
        setError("Please complete all session fields");
        return;
      }

      if(editForm.startTime >= editForm.endTime) {
        setError("The end time must be after the start time.");
        return;
      }

      if(
        !Number.isInteger(Number(editForm.capacity)) ||
        Number(editForm.capacity) < 1
      ) {
        setError("Capacity must be a whole number or greater");
        return;
      }

      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try{
      /**
       * Sends a PUT request to /api/sessions/:id to update
       * an existing gym session using the edited form data
       * and the trainer's authentication key.
       */
        const response = await fetchAPI(
          "PUT",
          `/sessions/${editingSession.session_id}`,
          {
            activityId: Number(editForm.activityId),
            locationId: Number(editForm.locationId),
            date: editForm.date,
            startTime: editForm.startTime,
            endTime: editForm.endTime,
            capacity: Number(editForm.capacity),
          },
          authKey
        );

        if(response.status === 200) {
          setEditingSession(null);
          setSuccess("Session updated successfully.");
          getSessions();
        } else {
          setError(response.body?.message || "Failed to update the session.");
        }
      } catch (err) {
        setError(err.message || "Failed to update the session.");
      } finally {
        setIsSaving(false);
      }
    };

    /**
 * Handles deleting an existing gym session.
 *
 * Displays a confirmation dialog before deleting.
 * Stops the operation if the trainer cancels.
 *
 * Checks whether an authentication key exists.
 * Sends a DELETE request to /api/sessions/:id
 * using the selected session's ID.
 *
 * If the API returns HTTP 200 or 204,
 * displays a success message and refreshes the session list.
 *
 * Handles API errors and resets the saving state.
 *
 * @async
 * @param {Object} session - The gym session selected for deletion.
 * @returns {Promise<void>}
 */
const handleDeleteSession = async (session) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete this ${session.activity_name} session?`
  );

  if (!confirmed) return;

  const authKey = localStorage.getItem("auth-key");

  if (!authKey) {
    setError("Please log in to delete a session.");
    return;
  }

  setIsSaving(true);
  setError(null);
  setSuccess(null);

  try {
    /**
     * Sends a DELETE request to /api/sessions/:id to delete
     * the selected gym session using its ID and the trainer's
     * authentication key.
     */
    const response = await fetchAPI(
      "DELETE",
      `/sessions/${session.session_id}`,
      null,
      authKey
    );

    if (response.status === 200 || response.status === 204) {
      setSuccess("Session deleted successfully.");
      getSessions();
    } else {
      setError(response.body?.message || "Failed to delete session.");
    }
  } catch (err) {
    setError(err.message || "Failed to delete session.");
  } finally {
    setIsSaving(false);
  }
};

    // Get unique activities and locations from loaded sessions
const availableActivities = Array.from(
  new Map(
    sessions
      .filter((session) => session.activity_id != null)
      .map((session) => [
        session.activity_id,
        {
          id: session.activity_id,
          name: session.activity_name,
        },
      ])
  ).values()
);

const availableLocations = Array.from(
  new Map(
    sessions
      .filter((session) => session.location_id != null)
      .map((session) => [
        session.location_id,
        {
          id: session.location_id,
          name: session.location_name,
        },
      ])
  ).values()
);

    //Filter Sessions
    const search = searchTerm.toLowerCase().trim();

const filteredSessions = sessions
  .filter((session) => {
    if (!search) return true;

  return (
  session.activity_name?.toLowerCase().includes(search) ||
  session.location_name?.toLowerCase().includes(search) ||
  session.trainer_name?.toLowerCase().includes(search) ||

  // Search using the formatted Australian date instead of the raw API date
  (session.session_date
    ? new Date(session.session_date).toLocaleDateString("en-AU", {
        timeZone: "Australia/Brisbane",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : ""
  ).includes(search)
);
})
.sort((a, b) => {
  // Sort sessions by date, with the latest sessions first
  const dateA = new Date(a.session_date);
  const dateB = new Date(b.session_date);

  return dateB - dateA;
});

/**
 * Formats a gym session date for display.
 *
 * Converts the supplied date into Australian date format
 * using the Australia/Brisbane timezone.
 *
 * Returns "Not set" when the date is missing.
 *
 * @param {string | Date} date - The session date to format.
 * @returns {string} The formatted date in DD/MM/YYYY format.
 */
const formatDate = (date) => {
  if (!date) return "Not set";

  return new Date(date).toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

    /**
 * Formats a gym session start or end time.
 *
 * Extracts the first five characters from the time value
 * to display the time in HH:MM format.
 *
 * Returns "Not set" when the time is missing.
 *
 * @param {string} time - The session time to format.
 * @returns {string} The formatted time or "Not set".
 */
    const formatTime = (time) => 
      time ? String(time).substring(0,5) : "Not set";

    return(
  <section className="mx-auto flex min-h-screen w-full min-w-0 flex-col gap-4 bg-[#f5f5f5] px-3 pt-5 pb-24 font-sans text-neutral-900">

    {/* Page Heading */}
    <div className="w-full rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-neutral-900">
        My Sessions
      </h1>

      <p className="mt-2 text-sm text-neutral-600">
         View your scheduled gym sessions.
      </p>
    </div>
         
            
            {/* Error Message */}
            {error && (
              <div className="alert alert-error text-sm" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                >
                  <FaTimes />
                </button>
              </div>
            )}

        {/* Success Message */}
        {success && (
          <div className="alert alert-success text-sm" role="status">
            <span>{success}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setSuccess(null)}
              aria-label="Dismiss success message"
            >
              <FaTimes />
            </button>
          </div>
        )}

      
        {/* TRAINER XML */}
<XMLDownloadButton
    route="/sessions/xml"
    authenticationKey={localStorage.getItem("auth-key") || ""}
    filename="sessions.xml"
    className="btn mt-2 w-full rounded-lg border border-[#452078] bg-white font-semibold text-[#452078] hover:bg-purple-50"
>
    Export Weekly Sessions (XML)
</XMLDownloadButton>

        

        {/* Search */}
        <form
          className="flex h-[62px] w-full min-w-0 items-center gap-2 rounded-lg border border-neutral-300 bg-[#f8f8f8] p-[5px]"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchTerm(filter.trim());
          }}
        >
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search gym sessions..."
            className="h-full min-w-0 flex-1 rounded-lg border-0 bg-transparent px-4 text-lg font-medium text-neutral-900 outline-none placeholder:text-neutral-500 focus:outline-none"
            aria-label="Search sessions"
            />

            <button
              type="submit"
              className="flex h-[52px] w-[60px] shrink-0 items-center justify-center rounded-md border-0 bg-[#7036D5] text-white shadow-none transition-colors hover:bg-[#5C2DB0] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="Search"
            >
              <FaSearch />
            </button>
        </form>

        {/* Automatic Refresh Indicator */}
{isRefreshing && (
  <div className="flex items-center justify-center gap-2 text-sm text-[#452078]">
    <span className="loading loading-spinner loading-sm" />
    <span>Updating sessions...</span>
  </div>
)}

        {/* Session Cards */}
        <div className="flex w-full min-w-0 flex-col gap-4">
          {isLoading && (
            <div className="flex justify-center rounded-xl bg-base-100 p-8 shadow-sm">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}

          {!isLoading && !error && filteredSessions.length === 0 && (
            <div className="rounded-xl bg-base-100 p-6 text-center text-sm text-base-content/60 shadow/sm">
                 No sessions found.
              </div>
          )}

          {!isLoading && 
            filteredSessions.map((session) => (
              <article
                key={session.session_id}
                className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm"
                >
                   {/* Session Details */}
                   <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-600">Activity Name</p>
                          <p className="mt-1 break-words text-base font-normal text-neutral-900">

                            {session.activity_name || "N/A"}
                          </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-500">Location Name</p>
                        <p className="mt-1 break-words text-base font-normal text-neutral-900">

                          {session.location_name || "N/A"}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-500">Date</p>
                        <p className="mt-1 break-words text-base font-normal text-neutral-900">

                          {formatDate(session.session_date)}
                        </p>
                      </div>

                      <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-500">Capacity</p>
                          <p className="mt-1 break-words text-base font-normal text-neutral-900">

                            {session.capacity ?? "Not set"}
                          </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-500">Start Time</p>
                        <p className="mt-1 break-words text-base font-normal text-neutral-900">

                          {formatTime(session.start_time)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-500">End Time</p> 
                         <p className="mt-1 break-words text-base font-normal text-neutral-900">

                            {formatTime(session.end_time)}
                          </p>
                      </div>

                      <div className="col-span-2 min-w-0">
                        <p className="text-xs font-medium text-neutral-500">Trainer</p>
                        <p className="mt-1 break-words font-medium">
                          {session.trainer_name || "You"}
                        </p>
                      </div>
                   </div>

                   {/* Session Action Buttons */}
<div className="mt-4 border-t border-neutral-200 pt-4">
    <div className="flex flex-row gap-3">



        {/* Delete Session */}
        <button
            type="button"
            onClick={() => handleDeleteSession(session)}
            className="btn h-10 flex-1 gap-2 rounded-lg border-red-600 bg-red-600 font-semibold text-white hover:border-red-700 hover:bg-red-700"
            disabled={isSaving}
        >
            <FaTrash />
            Delete
        </button>

    </div>
</div>
                </article>
              ))}
          </div>

          {/* Create Session Modal */}
{isCreating && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
    <div
      className="my-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-session-title"
    >
      {/* Modal Header */}
      <div className="text-center mb-5">

    <h2 id="create-session-title" className="text-2xl font-bold text-neutral-900">
        Create New Session
    </h2>
    <p cclassName="mt-2 text-sm text-neutral-600">
        Add a new session to the gym timetable.
    </p>

        
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreateSession} className="flex flex-col gap-4">

        {/* Activity */}
        <div>
          <label htmlFor="create-activity" className="mb-1 block text-sm font-medium">
            Activity
          </label>
          <select
            id="create-activity"
            name="activityId"
            value={createForm.activityId}
            onChange={handleCreateChange}
            className="select select-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          >
            <option value="">Select Activity</option>
            {activities.map((activity) => (
  <option key={activity.id} value={activity.id}>
    {activity.name}
  </option>
))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="create-location" className="mb-1 block text-sm font-medium">
            Location
          </label>
          <select
            id="create-location"
            name="locationId"
            value={createForm.locationId}
            onChange={handleCreateChange}
            className="select select-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
  <option key={location.id} value={location.id}>
    {location.name}
  </option>
))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="create-date" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="create-date"
            type="date"
            name="date"
            value={createForm.date}
            onChange={handleCreateChange}
            className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          />
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="create-start" className="mb-1 block text-sm font-medium">
            Start Time
          </label>
          <input
            id="create-start"
            type="time"
            name="startTime"
            value={createForm.startTime}
            onChange={handleCreateChange}
            className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="create-end" className="mb-1 block text-sm font-medium">
            End Time
          </label>
          <input
            id="create-end"
            type="time"
            name="endTime"
            value={createForm.endTime}
            onChange={handleCreateChange}
            className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          />
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="create-capacity" className="mb-1 block text-sm font-medium">
            Capacity
          </label>
          <input
            id="create-capacity"
            type="number"
            name="capacity"
            min="1"
            step="1"
            value={createForm.capacity}
            onChange={handleCreateChange}
            className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          />
        </div>

        {/* Form Buttons */}
        <div className="mt-2 flex flex-col gap-2">
          <button
  type="submit"
  className="btn h-12 w-full rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
  disabled={isSaving}
>
  {isSaving ? "Creating..." : "Create Session"}
</button>

          <button
            type="button"
            className="btn h-12 w-full rounded-lg border border-neutral-300 bg-white font-medium text-neutral-700 hover:bg-neutral-100"
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  </div>
)}

          
      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
          <div
          className="my-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-session-title"
          >
            

            {/* Modal Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="edit-session-title" className="text-xl font-bold">
                  Edit Session
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                    Update your session details.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-ghost btn-sm btn-square shrink-0"
                aria-label="Close edit form"
                disabled={isSaving}
                >
                  <FaTimes />
                </button>
            </div>
            
             {/* Session Information */}
             {/* Activity and Location */}
<div className="mb-5 grid grid-cols-2 gap-3 border-b border-base-200 pb-4">

  {/* Activity */}
  <div>
    <label htmlFor="edit-activity" className="mb-1 block text-sm font-medium">
      Activity
    </label>

    <select
      id="edit-activity"
      name="activityId"
      value={editForm.activityId}
      onChange={handleFormChange}
      className="select select-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
      required
    >
      <option value="">Select Activity</option>
      {activities.map((activity) => (
        <option key={activity.id} value={activity.id}>
          {activity.name}
        </option>
      ))}
    </select>
  </div>

  {/* Location */}
  <div>
    <label htmlFor="edit-location" className="mb-1 block text-sm font-medium">
      Location
    </label>

    <select
      id="edit-location"
      name="locationId"
      value={editForm.locationId}
      onChange={handleFormChange}
      className="select select-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
      required
    >
      <option value="">Select Location</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name}
        </option>
      ))}
    </select>
  </div>
</div>

             {/* Edit Form */}
             <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label
                htmlFor="edit-date"
                className="mb-1 block text-sm font-medium"
                >
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleFormChange}
                  className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
                  required
                ></input>
              </div>

              <div>
                <label
                htmlFor="edit-start-time"
                className="mb-1 block text-sm font-medium"
                >
                  Start Time
                </label>
                <input
                  id="edit-start-time"
                  type="time"
                  name="startTime"
                  value={editForm.startTime}
                  onChange={handleFormChange}
                  className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
                  required
                ></input>
              </div>

              <div>
                <label
                  htmlFor="edit-end-time"
                  className="mb-1 block text-sm font-medium"
                    >
                      End Time
                </label>
                <input
                  id="edit-end-time"
                  type="time"
                  name="endTime"
                  value={editForm.endTime}
                  onChange={handleFormChange}
                  className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
                  required
                > 
                </input>

                <div>
                  <label
                    htmlFor="edit-capacity"
                    className="mb-1 block-text text-sm font-medium">
                      Capacity
                    </label>
                    <input
                      id="edit-capacity"
                      type="number"
                      name="capacity"
                      min="20"
                      max="100"
                      step="1"
                      value={editForm.capacity}
                      onChange={handleFormChange}
                      className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 focus:border-neutral-500 focus:outline-none"
                      required
                    />
                </div>

                {/* Form Buttons */}
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="btn h-12 w-full rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
                    disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                        <span className="loading loading-spinner loading-sm" />
                        Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn h-12 w-full rounded-lg border border-neutral-300 bg-white font-medium text-neutral-700 hover:bg-neutral-100"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
             </form>
          </div>
        </div>
      )}

            
      </section>
    )

}
  export default MySessionsView;