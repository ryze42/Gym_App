import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router"
import TimetableView from './timetable/TimetableView'
import BookingView from './booking/BookingView'
import LoginView from './authentication/LoginView'
import Layout from './common/Layout'
import ProfileView from './profile/ProfileView'
import BlogPostView from './blog/BlogPostView'

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: TimetableView
      },
      {
        path: "/booking",
        Component: BookingView
      },
      {
        path: "/authenticate",
        Component: LoginView
      },
      {
        path: "/profile",
        Component: ProfileView
      },
      {
        path: "/blog",
        Component: BlogPostView
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
