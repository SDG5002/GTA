import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import "./navbar.css";
function Navbar() {

  const navigate = useNavigate();
  return (
    <div className='navbar'>
        <div className="navContainer">
            <div className="logoDiv">
                <h1  style={{color: "rgb(129, 5, 102)", fontSize: "2rem" }} onClick={() => navigate("/")}>GTA</h1>
            </div>
            <div className="navItems">
                <Link to="/register" className="navButton Register">Register</Link>
                <Link to="/login" className="navButton Login">Login</Link>
            </div>
        </div>
    </div>
  )
}

export default Navbar