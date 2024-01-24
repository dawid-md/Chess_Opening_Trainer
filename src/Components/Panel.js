import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../Config/firebase"
import { useContext } from "react"
import { AuthContext } from "../App"

export default function Panel(){
    const {user} = useContext(AuthContext)  //curly brackets are needed to destrcucture user from object
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User signed out");
            navigate('/'); //Redirect to home
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3">
            <div className="container">
                <a className="navbar-brand" aria-current="page" href="#"><h2>Opening <span className="text-warning"> Trainer</span></h2></a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navmenu">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        <li><Link className="nav-link" to="/">Home</Link></li>
                        {!user && <li><Link className="nav-link" to="/login">Login</Link></li>}
                        {!user && <li><Link className="nav-link" to="/register">Register</Link></li>}
                        <li><Link className="nav-link" to="/analysis">Analysis</Link></li>
                        <li><Link className="nav-link" to="/multiplayer">Multiplayer</Link></li>
                        <li><Link className="nav-link" to="/random">Random</Link></li>
                        <li><Link className="nav-link" to="/">Settings</Link></li>
                        {user && <li><Link className="nav-link" to="/">Profile</Link></li>}
                        {/* {user && <li><Link className="nav-link" to="/">Sign out</Link></li>} */}
                        {user && <li><div className="nav-link" onClick={handleLogout}>Sign out</div></li>}
                    </ul>
                </div>
            </div>
        </nav>
    )
}