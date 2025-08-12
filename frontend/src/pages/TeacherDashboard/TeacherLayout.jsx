import { Outlet } from "react-router-dom"
import TeacherNavbar from "./TeacherNavbar/TeacherNavbar"


function TeacherLayout() {
  return (
    <>
    <TeacherNavbar />
    <Outlet />
    </>
  )
}

export default TeacherLayout