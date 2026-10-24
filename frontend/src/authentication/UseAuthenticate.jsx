import {
    createContext,  // Creates a context that can share authentication data across components
    useCallback, // Creates reusable functions without recreating them unnecessarily
    useContext, // Lets components access values from a React context
    useEffect, // Runs code when the component loads or when dependencies change
    useState, // Creates and updates state values
} from "react";
import {fetchAPI} from "../api.mjs"; // Imports the function used to send API requests
import {useNavigate} from "react-router"; // Lets the app navigate to another page

export const AuthenticationController = createContext(null);

export function AuthenticationProvider({children}) {  // Creates a provider component for authentication
    const [user, setUser] = useState(null); // Stores the currently logged-in user
    const [status, setStatus] = useState("resuming"); // Stores the current authentication status

    useEffect(() => { // Runs authentication checks when the component loads
        const authenticationKey = localStorage.getItem("auth-key"); // Gets the saved authentication key from local storage

        if(authenticationKey){ // Checks if an authentication key exists
            fetchAPI("GET", "/users/self", null, authenticationKey) // Requests the current user's details from the API
            .then((response) => { // Runs when the API sends back a response
                if (response.status === 200) {  // Checks if the user was loaded successfully
                    setUser(response.body); // Stores the logged-in user's details
                    setStatus("loaded"); // Sets authentication status to loaded
                } else {
                    localStorage.removeItem("auth-key");  // Removes the invalid authentication key
                    setStatus("logged out");  // Sets the authentication status to logged out
                }
            });

                    }
    }, []); // closes useEffect

            return(
                <AuthenticationController.Provider
                    value={{
                        user, // Shares the current user
                        setUser, // Shares the function used to update the user
                        status,  // Shares the current authentication status
                        setStatus,  // Shares the function used to update the status
                    }}
                    >
                        {children}
                    </AuthenticationController.Provider>
            ); 
        }

      export function useAuthenticate(restrictToRoles = null) { // Creates a custom hook for authentication
            const context = useContext(AuthenticationController); // Gets authentication data from the context
            const navigate = useNavigate(); // Lets the hook navigate to another page
      
        if(!context) { // Checks that the hook is being used inside the AuthenticationProvider
            throw new Error(
                "useAuthenticate must be used within AuthenticationProvider",
            );
        }

        const {user, setUser, status, setStatus} = context; // Gets authentication values and update functions

        const getUser = useCallback(
            (authenticationKey) => { // Creates a function for loading the logged-in user
                if(authenticationKey) {  // Checks that an authentication key exists
                    setStatus("loading");  // Sets the authentication status to loading

                    fetchAPI("GET", "/users/self", null, authenticationKey) // Requests the current user's details
                        .then((response) => { // Runs when the API responds
                            if(response.status === 200) { // Checks if the request was successful
                                setUser(response.body); // Stores the user's details
                                setStatus("loaded"); // Sets the authentication status to loaded
                            } else {
                                localStorage.removeItem("auth-key");  // Removes an invalid authentication key
                                setUser(null);   // Clears the current user
                                setStatus(response.body?.message || "Failed to Load User");  // Stores an error message
                            }
                        })
                        .catch((error) => {  // Runs if the API request fails
                            setStatus(String(error)); // Stores the error as the authentication status
                        }); 
                }
            },
            [setUser, setStatus], // Recreates the function if these values change
        );

        const logout = useCallback(() => { // Creates a reusable function for logging the user out
            const authenticationKey = localStorage.getItem("auth-key"); // Gets the saved authentication key

            fetchAPI("DELETE", "/authenticate", null, authenticationKey) // Sends a request to log the user out
                .finally(() => { // Runs after the logout request finishes
                    setUser(null);  // Clears the current user
                    localStorage.removeItem("auth-key"); // Removes the saved authentication key
                    setStatus("Logged out"); // Updates the authentication status
                    navigate("/");  // Sends the user back to the home or login page
                });
        }, [setUser, setStatus, navigate]); // Recreates the function if these values change

        const refresh = useCallback(() => { // Creates a function for refreshing the current user data
            const authenticationKey = localStorage.getItem("auth-key");  // Gets the saved authentication key

            if(authenticationKey) { // Checks if an authentication key exists
                getUser(authenticationKey); // Loads the current user again
            }
        }, [getUser]); // Recreates the function if getUser changes

        useEffect(() => { // Checks whether the user is allowed to access the current page
            if (
                restrictToRoles && // Checks if the page has role restrictions
                status !== "resuming" && // Waits until authentication has finished loading
                (!user || !restrictToRoles.includes(user.role)) // Checks if the user is missing or has the wrong role
            ) {
                navigate("/"); // Sends unauthorized users back to the home or login page
            }
        }, [user, status, restrictToRoles, navigate]); // Runs again when these values change

        // Log the user in using their email and password
const login = useCallback(async (email, password) => {
    const response = await fetchAPI("POST", "/authenticate", {
        email,
        password,
    });

    if (response.status === 200) {
        const authKey = response.body.authenticationKey;
        localStorage.setItem("auth-key", authKey);
        getUser(authKey);
    }

    return response;
}, [getUser]);

        return{ // Returns authentication values and functions from the custom hook
            user, // Returns the current logged-in user
            login,
            logout, // Returns the logout function
            refresh, // Returns the refresh function
            status, // Returns the current authentication status
        };
    }
