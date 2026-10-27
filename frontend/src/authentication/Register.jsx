import {useState, useCallback} from "react";
import { useNavigate } from "react-router";
import {fetchAPI} from "../api.mjs";
import validator from "validator";

function Register() { // Creates the Register React component
    const [first_name, setFirstName] = useState(""); // Stores and updates the user's first name
    const [lastName, setLastName] = useState(""); // Stores and updates the user's last name
    const [email, setEmail] = useState(""); // Stores and updates the user's email
    const [password, setPassword] = useState(""); // Stores and updates the user's password
    const [validationErrors, setValidationErrors] = useState({}); // Stores validation error messages
    const [loading, setLoading] = useState(false);  // Tracks whether the registration request is loading
    const [status, setStatus] = useState(""); // Stores the current registration status or message
    const navigate = useNavigate(); // Lets the user navigate to another page

    const submitUser = useCallback(() => { // Handles the registration form submission
        setLoading(true); // Sets loading to true while processing registration
        setStatus("");  // Clears any previous status or error messages
        setValidationErrors({});  // Clears previous validation errors

        const errors = {}; // Creates an empty object to store new validation errors

        // Allows letters, spaces, hyphens, and apostrophes with at least 2 characters
        if(!/^[a-zA-Z\-'\s]{2,}$/.test(first_name)) {
            errors.first_name = "Missing or invalid first name";
        }
        // Checks that the last name only contains allowed characters and is at least 1 character long
        if(!/^[a-zA-Z\-'\s]{1,}$/.test(lastName)) {
            errors.lastName = "Missing or invalid last name";
        }
        if(!validator.isEmail(email)) {
            errors.email = "Missing or invalid email";
        }
        // Checks that the password field is not empty
        if(!password || password.length < 4) {
            errors.password = "Password must be at least 4 characters long"
        }

        if(Object.keys(errors).length > 0) {  // Checks if there are any validation errors
            setValidationErrors(errors); // Saves the validation errors so they can be displayed
            setLoading(false); // Stops the loading  
            return; // Stops the function from continuing
        }

        fetchAPI("POST", "/users", { // Sends a POST request to create a new user
            firstName: first_name, // Sends the user's first name
            lastName: lastName, // Sends the user's last name
            email: email,  // Sends the user's email
            password: password, // Sends the user's password
            role: "member", // Sets the new user's role as member
        })
        .then((response) => { // Runs after the API sends back a response
            if (response.status === 200 || response.status === 201) { // Checks if the user was created successfully
                navigate("/")  // Sends the user back to the home or login page
            } else {
                setStatus("Failed to create user - " + (response.body?.message || "Unknown Error")); // Shows an error message if registration fails
                setLoading(false); // Stops the loading state
            }
        })
        .catch((error) => { // Runs if the API request fails
            setStatus("Failed to create user - " + error.message); // Shows the error message
            setLoading(false); // Stops the loading state
        });
    }, [first_name, lastName, email, password, navigate]) // Recreates the function when these values change

    return (
        <section className="flex flex-col justify-center items-center min-h-[calc(100dvh-5rem)] bg-[#f5f5f5] px-4 py-8 gap-4">
            

            <form 
                className="w-full max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-lg sm:p-8"
                onSubmit={(e) => { // Runs when the registration form is submitted
                    e.preventDefault();  // Stops the page from refreshing
                    submitUser();  // Calls the function that creates the user
                }}
                >

                     <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">
            Join High Street Gym
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
            Create your account and start your fitness journey.
        </p>
    </div>

                        
                    <label className="form-control w-full">
                        <span className="label-text mb-2 font-medium text-neutral-700">First Name</span>
                        <input 
                            value={first_name} // Displays the current first name value
                            onChange={(e) => setFirstName(e.target.value)} // Updates the first name when the user types
                            type="text"
                            placeholder="Enter your first name"
                            className={`input input-bordered w-full rounded-lg border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none ${validationErrors.first_name ? 'input-error' : ''}`}// Adds an error style if the first name is invalid
                            disabled={loading} // Disables the input while the form is loading
                            />
                            {validationErrors.first_name && ( // Only shows the error message if a first name error exists
                                <p className="text-error text-xs mt-1">{validationErrors.first_name}</p>
                            )}
                    </label>

                    <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium text-neutral-700">Last Name</span>
                    <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        type="text"
                        placeholder="Enter your last name"
                        className={`input input-bordered w-full rounded-lg border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none ${validationErrors.lastName ? 'input-error' : ''}`}
                        disabled={loading}
                    />
                    {validationErrors.lastName && (
                        <p className="text-error text-xs mt-1">
                            {validationErrors.lastName}
                        </p>
                    )}
                </label>

                    <label className="form-control w-full">
                        <span className="label-text mb-2 font-medium text-neutral-700">Email</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="Enter your email"
                            className={`input input-bordered w-full rounded-lg border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none ${validationErrors.email ? 'input-error' : ''}`}
                            disabled={loading}
                        />
                        {validationErrors.email && (
                            <p className="text-error text-xs mt-1">{validationErrors.email}</p>
                        )}
                    </label>

                    <label className="form-control w-full">
                        <span className="label-text mb-2 font-medium text-neutral-700">Password</span>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="Create a password"
                            className={`input input-bordered w-full rounded-lg border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none ${validationErrors.password ? 'input-error' : ''}`}
                            disabled={loading}
                            />
                            {validationErrors.password && (
                                <p className="text-error text-xs mt-1">{validationErrors.password}</p>
                            )}
                    </label>



                    <button
                        type="submit"
                        disabled={loading}
                        className="btn mt-4 h-12 w-full rounded-lg border-[#452078] bg-[#452078] font-semibold text-white hover:border-[#65429a] hover:bg-[#65429a]"
                        >
                            {loading ? <span className="loading loading-spinner"></span> : "Become A Member"}
                        </button>

                        {status && (
                            <div className="alert alert-error mt-2 py-2 shadow-sm rounded-md">
                                <span className="text-sm">{status}</span>
                            </div>
                        )}

                        <p className="text-center text-sm text-neutral-600">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-semibold text-[#452078] hover:underline"
                        >
                            Sign In
                        </button>
                    </p>

                </form>
        </section>
    )
}

export default Register;