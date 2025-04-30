import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router"
import TimetableView from './timetable/TimetableView'
import BookingView from './booking/BookingView'
import LoginView from './authentication/LoginView'

const router = createBrowserRouter([
  {
    path: "/",
    Component: TimetableView
  },
  {
    path: "/booking",
    Component: BookingView
  },
  {
    path: "/autheticate",
    Component: LoginView
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
