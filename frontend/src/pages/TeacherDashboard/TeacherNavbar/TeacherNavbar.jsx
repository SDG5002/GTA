import "./TeacherNavbar.css";
import { NavLink, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function TeacherNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="teacher-nav-container">
      <div className="teacher-navbar">
        <div className="teacher-navbar-top">
          <div
            className="teacher-navbar-logo"
            onClick={() => {
              navigate("/teacher-dashboard");
              closeMenu();
            }}
          >
            🧪 GTA
          </div>
          <div
            className="teacher-menu-icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            &#9776;
          </div>
        </div>

        <div className={`teacher-navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="/teacher-dashboard"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "teacher-nav-link active" : "teacher-nav-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/teacher-dashboard/reports"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "teacher-nav-link active" : "teacher-nav-link"
            }
          >
            Reports
          </NavLink>

          <NavLink
            to="/teacher-dashboard/account"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "teacher-nav-link active" : "teacher-nav-link"
            }
          >
            Account
          </NavLink>

          <Link to="/" className="teacher-logout-button" onClick={closeMenu}>
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TeacherNavbar;
