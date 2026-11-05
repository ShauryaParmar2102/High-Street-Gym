import { useCallback, useEffect, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { FaRightToBracket } from "react-icons/fa6";
import { useAuthenticate } from "./UseAuthenticate";
import { useNavigate } from "react-router";

// Creates the LoginView React component
function LoginView() {
    const navigate = useNavigate();  // Lets the user navigate to another page
    const [email, setEmail] = useState(""); // Stores and updates the email value
    const [password, setPassword] = useState(""); // Stores and updates the password value
    const {login, status, user} = useAuthenticate(); // Gets login function, login status, and current user

    const onLoginSubmit = useCallback( // Creates a reusable function for submitting the login form
        (e) => {
            e.preventDefault(); // Stops the form from refreshing the page
            login(email, password); // Sends the entered email and password to the login function
            },
            [email, password, login] // Recreates the function if email, password, or login changes
    );

    // ========== ROLE-BASED LOGIN REDIRECTION ==========
    // Redirects members to the timetable and trainers to the sessions page.
    // Only members and trainers have a defined redirect after login.

    useEffect(() => { // Runs when the logged-in user changes
        if (user) {  // Checks that a user is logged in
            if (user.role === "member") { // Checks if the user is a member
                navigate("/timetable"); //Sends member to the timetable page
            } else if (user.role === "trainer") { // Checks if the user is a trainer
                navigate("/session"); // Sends trainers to the session page
            }
        }
    }, [user, navigate]); // Runs again if the user or navigate function changes

    const isAuthenticating = status === "authenticating"; // Checks if the login process is currently happening

    return(
        <section className="min-h-[calc(100dvh-11rem)] flex items-center justify-center bg-[#f5f5f5] px-6">
            <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-lg sm:p-8">
                <div className="card-body flex justify-center">
                    <div className="mb-4 text-center">

    {/* Login icon */}
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
        <FaLock className="text-2xl text-[#452078]" />
    </div>

    {/* Login heading */}
    <h1 className="text-3xl font-bold text-[#452078]">
        Login
    </h1>

    {/* Login description */}
    <p className="mt-2 text-sm text-neutral-600">
        Welcome back! Sign in to your account.
    </p>

</div>

                        <form
                            onSubmit={onLoginSubmit}
                            className="flex flex-col flex-1 justify-center gap-4">

                            <label className="form-control w-full">
                                <span className="label-text mb-2 font-medium text-neutral-700">Email</span>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Email"
                                    className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                                    disabled={isAuthenticating}
                                    required
                                    />
                            </label>

                            <label className="form-control w-full">
                                <span className="label-text mb-2 font-medium text-neutral-700">Password</span>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    placeholder="Enter your password"
                                    className="input input-bordered w-full rounded-lg border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                                    disabled={isAuthenticating}
                                    required
                                    />
                            </label>

                            {/* ========== LOGIN ERROR MESSAGE ========== */}
                            {status && !["loaded", "resuming", "loading", "authenticating", "logged out", "Logged out"].includes(status) && (
                                <div
                                    role="alert"
                                    className="alert alert-error rounded-lg py-2 text-sm"
                                >
                                    <span>
                                        {status === "invalid_credentials"
                                            ? "Incorrect email or password"
                                            : status}
                                    </span>
                                </div>
                            )}

                            <div className="mt-6 flex flex-row gap-3">
                                <button
                                    type="submit"
                                    className="btn flex-1 rounded-lg border-[#452078] bg-[#452078] text-white hover:border-[#65429a] hover:bg-[#65429a]"
                                    disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <span className="loading loading-spinner loading-sm"></span>
                                        ) : (
                                            <>
                                            <FaRightToBracket className="text-lg" />
                                                Login
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/register")}
                                        className="btn flex-1 rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-100"
                                        disabled={isAuthenticating} 
                                    >
                                        <FaUserPlus className="text-lg" />
                                        Register
                                    </button>
                                </div>                     
                </form>


                    </div>
                </div>
            </section>

        );
    }

export default LoginView;