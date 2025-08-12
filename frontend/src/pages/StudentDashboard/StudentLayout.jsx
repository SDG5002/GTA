import { Outlet } from "react-router-dom";
import StudentNavbar from "./StudentNavbar/StudentNavbar";

export default function StudentLayout() {
    return (
        <>
            <StudentNavbar />
            <Outlet />
        </>
    );
}