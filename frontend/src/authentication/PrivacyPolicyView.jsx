
import { Link } from "react-router";
import { FaShieldAlt } from "react-icons/fa";

// Privacy Policy page for the High Street Gym demonstration website
export default function PrivacyPolicyView() {
    return (
        <main className="min-h-[70vh] w-full bg-[#f5f5f5] px-6 py-10">
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-lg sm:p-10">

    {/* Privacy Policy heading and icon */}
    <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-purple-100 p-4">
                <FaShieldAlt className="text-3xl text-[#452078]" />
            </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-[#452078]">
            Privacy Policy
        </h1>

        <p className="text-sm text-neutral-500">
            High Street Gym | Privacy &amp; Data Protection
        </p>
    </div>

                {/* Privacy legislation */}
                <h2 className="mb-2 text-xl font-semibold">
                    1. Privacy Legislation
                </h2>
                <p className="mb-6">
                    This demonstration project considers the Privacy
                    Act 1988 (Cth) and the Australian Privacy Principles
                    (APPs), which provide a framework for handling
                    personal information in Australia.
                </p>

                {/* Information collection */}
                <h2 className="mb-2 text-xl font-semibold">
                    2. Information We Collect
                </h2>
                <p className="mb-6">
                    The application collects information entered by
                    users, including names, email addresses, account
                    details, gym bookings and user-created posts.
                    This information supports the functionality
                    of the demonstration website.
                </p>

                {/* Information usage */}
                <h2 className="mb-2 text-xl font-semibold">
                    3. How Information Is Used
                </h2>
                <p className="mb-6">
                    Personal information is used to manage user
                    accounts, authenticate users, organise gym
                    sessions, process bookings and display
                    user-created content.
                </p>

                {/* Access control */}
                <h2 className="mb-2 text-xl font-semibold">
                    4. Access to Information
                </h2>
                <p className="mb-6">
                    The application uses role-based access controls
                    for members, trainers and administrators.
                    These controls are designed to restrict access
                    to features and information according to each
                    user's assigned role.
                </p>

                {/* Data security */}
                <h2 className="mb-2 text-xl font-semibold">
                    5. Data Security
                </h2>
                <p className="mb-6">
                    High Street Gym includes authentication and
                    access-control features to help prevent
                    unauthorised access to user information.
                    As this is an educational demonstration,
                    it should not be used to store real sensitive
                    personal or health information.
                </p>

                {/* XML exports */}
                <h2 className="mb-2 text-xl font-semibold">
                    6. XML Data Exports
                </h2>
                <p className="mb-6">
                    The application provides XML export functionality
                    for bookings and trainer sessions. These exports
                    are intended to provide information to authorised
                    users according to their access permissions.
                    Exported files should be stored and shared securely.
                </p>

                {/* User rights */}
                <h2 className="mb-2 text-xl font-semibold">
                    7. Access and Correction
                </h2>
                <p className="mb-6">
                    Users can view their account information through
                    the profile features provided by the application.
                    Requests to correct information can be directed
                    to the project administrator.
                </p>

                {/* Contact */}
                <h2 className="mb-2 text-xl font-semibold">
                    8. Contact
                </h2>
                <p className="mb-6">
                    For questions about privacy or the handling
                    of information within this demonstration project,
                    please contact the project administrator.
                </p>

                <p className="mb-6 text-xs text-neutral-500">
                    Note: This is a sample Privacy Policy created
                    for a TAFE Queensland assessment project.
                    It is not a legally reviewed privacy notice.
                </p>

                <div className="flex justify-center mt-6">
                    <Link
                        to="/login"
                        className="btn border-[#452078] bg-[#452078] text-white hover:bg-[#65429a]"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
