import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthenticationProvider } from './authentication/useAuthenticate'
import './index.css'
import Layout from './common/Layout'
import TimetableView from './timetable/TimetableView'
import BookingView from './booking/BookingView'
import LoginView from './authentication/LoginView'
import ProfileView from './profile/ProfileView'
import BlogPostView from './blog/BlogPostView'

const router = createBrowserRouter([
  {
    element: (
      <AuthenticationProvider>
        <Layout />
      </AuthenticationProvider>
    ),
    children: [
      { index: true, element: <TimetableView /> },
      { path: '/booking', element: <BookingView /> },
      { path: '/authenticate', element: <LoginView /> },
      { path: '/profile', element: <ProfileView /> },
      { path: '/blog', element: <BlogPostView /> },
    ],
  },
]);
console.log("from main");
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
