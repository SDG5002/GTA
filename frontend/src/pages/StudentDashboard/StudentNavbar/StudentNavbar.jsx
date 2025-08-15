import "./StudentNavbar.css";
import { NavLink, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function StudentNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); 

  return (
    <div className="student-nav-container">
      <nav className="student-navbar">
        <div className="student-navbar-top">
          <div className="student-navbar-logo" onClick={() => navigate("/student-dashboard")}>
            🧪 GTA
          </div>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            &#9776;
          </div>
        </div>

        <div className={`student-navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="/student-dashboard"
            end
            className={({ isActive }) =>isActive ? "student-nav-link active" : "student-nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/student-dashboard/reports"
            end
            className={({ isActive }) =>isActive ? "student-nav-link active" : "student-nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Reports
          </NavLink>

          <NavLink
            to="/student-dashboard/account"
            end//end matches exact path(without this path with same prev path also be active)
            className={({ isActive }) =>isActive ? "student-nav-link active" : "student-nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Account
          </NavLink>

          <Link to="/" className="student-logout-button" onClick={() => setMenuOpen(false)}>
            Logout
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default StudentNavbar;
