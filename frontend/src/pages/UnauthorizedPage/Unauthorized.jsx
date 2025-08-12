import './Unauthorized.css';

function Unauthorized() {
  return (
    <div className="unauthorized">
      <h1 className="code">401</h1>
      <h2 className="title">Unauthorized</h2>
      <p className="message">You are not allowed to access this page.</p>
    </div>
  );
}

export default Unauthorized;
