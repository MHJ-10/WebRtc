import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <Link to="/sender">SENDER</Link>
      <Link to="/receiver">RECEIVER</Link>
    </div>
  );
};

export default Home;
