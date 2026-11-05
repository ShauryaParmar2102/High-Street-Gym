
import { FaShieldAlt } from "react-icons/fa";

// Privacy Policy page for the High Street Gym demonstration website
export default function PrivacyPolicyView() {
    return (
        <main className="min-h-screen w-full bg-[#f5f5f5] px-4 pt-8 pb-28 text-neutral-900 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">

                {/* Privacy Policy heading and icon */}
                <header className="mb-10 text-center">

                    {/* Privacy icon */}
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                        <FaShieldAlt className="text-2xl text-[#452078]" />
                    </div>

                    <h1 className="text-3xl font-bold text-[#452078]">
                        Privacy Policy
                    </h1>

                    <p className="mt-2 text-sm text-neutral-500">
                        High Street Gym | Privacy &amp; Data Protection
                    </p>

                    {/* Introduction */}
                    <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-600">
                        This policy explains how the High Street Gym
                        demonstration application handles personal
                        information and protects user data.
                    </p>
                </header>

                {/* Privacy policy sections */}
                <div className="space-y-8">

                    {/* Privacy legislation */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            1. Privacy Legislation
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            This demonstration project considers the Privacy
                            Act 1988 (Cth) and the Australian Privacy Principles
                            (APPs), which provide a framework for handling
                            personal information in Australia.
                        </p>
                    </section>

                    {/* Information collection */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            2. Information We Collect
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            The application collects information entered by
                            users, including names, email addresses, account
                            details, gym bookings and user-created posts.
                            This information supports the functionality
                            of the demonstration website.
                        </p>
                    </section>

                    {/* Information usage */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            3. How Information Is Used
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            Personal information is used to manage user
                            accounts, authenticate users, organise gym
                            sessions, process bookings and display
                            user-created content.
                        </p>
                    </section>

                    {/* Access control */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            4. Access to Information
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            The application uses role-based access controls
                            for members, trainers and administrators.
                            These controls are designed to restrict access
                            to features and information according to each
                            user's assigned role.
                        </p>
                    </section>

                    {/* Data security */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            5. Data Security
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            High Street Gym includes authentication and
                            access-control features to help prevent
                            unauthorised access to user information.
                            As this is an educational demonstration,
                            it should not be used to store real sensitive
                            personal or health information.
                        </p>
                    </section>

                    {/* XML exports */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            6. XML Data Exports
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            The application provides XML export functionality
                            for bookings and trainer sessions. These exports
                            are intended to provide information to authorised
                            users according to their access permissions.
                            Exported files should be stored and shared securely.
                        </p>
                    </section>

                    {/* User rights */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            7. Access and Correction
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            Users can view their account information through
                            the profile features provided by the application.
                            Requests to correct information can be directed
                            to the project administrator.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="border-b border-purple-100 pb-2 text-lg font-bold text-[#452078]">
                            8. Contact
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-neutral-700">
                            For questions about privacy or the handling
                            of information within this demonstration project,
                            please contact the project administrator.
                        </p>
                    </section>

                </div>

                {/* Assessment disclaimer */}
                <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs leading-6 text-neutral-600">
                        Note: This is a sample Privacy Policy created
                        for a TAFE Queensland assessment project.
                        It is not a legally reviewed privacy notice.
                    </p>
                </div>

            </div>
        </main>
    );
}
