import { useContext } from "react";
import "./MyAccountPage.css";
import { AuthContext } from "../../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";

function MyAccountPage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="my-account-container">
      <div className="my-account-box">
        <h2 className="my-account-title"><FaUserCircle />   My Account</h2>
        {user ? (
          <div className="my-account-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Joined GTA:</strong> {
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : "Unknown"
            }</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default MyAccountPage;
