import { useState, useCallback, useEffect } from "react";
import {useAuthenticate} from "../authentication/UseAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import validator from "validator";

function ProfileView() {

    // Get the logged-in user's details, refresh function and authentication status
    const {user, refresh, status: authStatus } = useAuthenticate();

     // Store the user's first name
    const [firstName, setFirstName] = useState("");
    const [lastname, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

       // Fill in the form with the logged-in user's details
    useEffect(() => {
        if(user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
        }
    }, [user]);

    // Function to update the logged-in user's profile
    const submitUpdate = useCallback(() => {

         // Stop the function if no user is logged in
        if(!user) {
            return;
        }

        // Show the loading state and clear any previous status message
        setLoading(true);
        setStatus(null);

        // Store any validation errors
        const errors = {};

            // Check if the first name contains valid characters and is at least 2 characters long
        if (!/^[a-zA-Z\-']{2,}$/.test(firstName.trim())) {
            errors.firstName = "Invalid first name";
        }
        if (!/^[a-zA-Z\-']{2,}$/.test(lastname.trim())) {
            errors.lastName = "Invalid Last Name"
        }

        if (!validator.isEmail(email)) {
            errors.email = "Invalid email address";
        }

        setValidationErrors(errors); // Save the validation errors so they can be displayed

         // Stop the update if there are any validation errors
        if(Object.keys(errors).length > 0) {
            setLoading(false);
            return;
        }

            // Send a PATCH request to update the user's details in the backend
        fetchAPI(
            "PATCH",
            "/users/" + user.id,
            {
                firstName: firstName.trim(),
                lastName: lastname.trim(),
                email: email.trim()
            },
            localStorage.getItem("auth-key") // Get the authentication key from local storage
        )

         // Handle the response from the backend
        .then(response => {
            if(response.status === 200) {
                setStatus("Profile updated successfully");
                refresh();
            } else {

                // Display an error message if the update failed
                setStatus(
                    "Update failed: " +
                    (response.body?.message || "Unknown error")
                );
            }

            setLoading(false); // Stop showing the loading state
        })

         // Handle any errors that occur during the API request
        .catch(error => {
            setStatus(String(error));
            setLoading(false);
        });   

        // Recreate the function when any of these dependencies change
    }, [firstName, lastname, email, user, refresh]);

    // Show a loading spinner while authentication is being restored
    if (authStatus === "resuming") {
        return(
            <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-xl"></span>
            </div>
        );
    }

    //NOT LOGGED IN
    // Show a message if the user is not logged in
        if (!user) {
            return (
                <div className="flex flex-col items-center gap-4 p-8">
                    <h1 className="text-2xl font-bold">
                        Login Required
                    </h1>

                    <p>You need to login to view your profile.</p>

                    <a href="/login" className="btn btn-primary">
                        Go to Login
                    </a>
                </div>
            );
        }

        return (
        <section className="flex min-h-[calc(100dvh-11rem)] flex-col items-center gap-4 bg-[#f5f5f5] p-4 text-neutral-900">

            {/* HEADER */}
            <div className="mb-3 w-full rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">

                <h1 className="text-3xl font-bold text-neutral-900">

                    My Profile
                </h1>

                    <p className="mt-1 text-sm text-neutral-600">
        View and manage your personal information.
    </p>

                <p className="text-sm opacity-60 mt-2">
                    Role:{" "}
                    <span className="badge badge-sm border-none bg-neutral-200 font-semibold text-neutral-900">

                        {user.role}
                    </span>
                </p>
            </div>

            {/* PERSONAL DETAILS */}
            <fieldset className="fieldset self-stretch rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">

                <legend className="fieldset-legend mx-auto px-4 text-lg font-semibold text-neutral-900">


                    Personal Details
                </legend>

                 {/* FIRST NAME */}
                 <label className="label text-neutral-700">
                    First Name
                 </label>

                 <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="input w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                     type="text"
                     placeholder="First name"
                     disabled={loading}
                     />

                     {validationErrors.firstName && (
                        <label className="label text-red-500">
                            {validationErrors.firstName}
                        </label>
                     )}

                {/* LAST NAME */}
                <label className="label text-neutral-700">
                    Last Name
                </label>

                <input 
                    value={lastname}
                    onChange={e => setLastName(e.target.value)}
                    className="input w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                    type="text"
                    placeholder="last name"
                    disabled={loading}
                    />

                    {validationErrors.lastName && (
                        <label className="label text-red-500">
                            {validationErrors.lastName}
                        </label>
                    )}

                     {/* EMAIL */}
                     <label className="label text-neutral-700">
                        Email
                     </label>

                     <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                        type="email"
                        placeholder="Email"
                        disabled={loading}
                        />

                        {validationErrors.email && (
                            <label className="label text-red-500">
                                {validationErrors.email}
                            </label>
                        )}
           

             {/* STATUS */}
             {status && (
                <span
                    className={
                        status.includes("success")
                        ? "text-success self-start"
                        : "text-error self-start"
                            }
                            >
                                {status}
                            </span>
                    )}

                    {/* UPDATE */}
                    <button
                    disabled={loading}
                    onClick={submitUpdate}
                    className="btn mt-4 w-full rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
                    >
                        Update Profile

                        {loading && (
                            <span className="loading loading-spinner loading-sm"></span>
                        )}
                    </button>


                       

             </fieldset>

        </section>
    );
}

export default ProfileView;