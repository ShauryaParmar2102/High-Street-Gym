
import { StrictMode, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import PrivacyPolicyView from './authentication/PrivacyPolicyView';
import './index.css'
import {
  AuthenticationProvider,
  AuthenticationController
} from './authentication/UseAuthenticate';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from './common/Layout'
import TimetableView from './timetable/TimetableView';
import LoginView from './authentication/LoginView'
import Register from './authentication/Register'
import MySessionsView from './sessions/MySessionsView';
import BookingView from './booking/BookingView'
import BlogView from './post/BlogView';
import ProfileView from './profile/ProfileView';

// Displays a 401 or 403 error page
function StatusErrorView({ status }) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">
        {status}
      </h1>

      <h2 className="text-2xl font-semibold mb-3">
        {status === 401 ? "Unauthenticated" : "Unauthorised"}
      </h2>

      <p className="mb-6">
        {status === 401
          ? "You must be logged in to access this page."
          : "You do not have permission to access this page."}
      </p>

      <a href="/" className="btn btn-primary">
        Return Home
      </a>
    </main>
  );
}

// Protects routes by checking if the user is logged in
// and has the correct role to access the page.
// Displays 401 for unauthenticated users and 403 for unauthorised users.
function ProtectedRoute({ allowedRoles, children }) {
  const { user, status } = useContext(AuthenticationController);

  if (status === "resuming" || status === "loading") {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!user) {
    return <StatusErrorView status={401} />;
  }

  if (!allowedRoles.includes(user.role?.toLowerCase())) {
    return <StatusErrorView status={403} />;
  }

  return children;
}

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: LoginView,
      },
      {
        path: "/timetable",
        Component: TimetableView,
      },
      {
        path: "/login",
        Component: LoginView
      },
      {
        path: "/register",
        Component: Register
      },
      {
        path: "/privacy-policy",
        Component: PrivacyPolicyView
      },
      {
        path: "/blog",
        Component: BlogView
      },
      {
        path: "/user/self",
        Component: ProfileView
      },
      {
        path: "/session",
        element: (
          <ProtectedRoute allowedRoles={["trainer", "admin"]}>
            <MySessionsView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/bookings",
        element: (
          <ProtectedRoute allowedRoles={["member", "admin"]}>
            <BookingView />
          </ProtectedRoute>
        ),
      },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthenticationProvider>
      <RouterProvider router={router} />
    </AuthenticationProvider>
  </StrictMode>,
)
