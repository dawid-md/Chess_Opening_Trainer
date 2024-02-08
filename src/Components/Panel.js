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
        <nav className="custom-navbar bg-dark">
                <a className="brand-name1" href="www.google.com"><h2>Opening <span className="brand-name2"> Trainer</span></h2></a>
                <div className="collapse">
                    <ul className="nav-items">
                        <li><Link className="nav-link" to="/">Home</Link></li>
                        {!user && <li><Link className="nav-link" to="/login">Login</Link></li>}
                        {!user && <li><Link className="nav-link" to="/register">Register</Link></li>}
                        <li><Link className="nav-link" to="/analysis">Analysis</Link></li>
                        <li><Link className="nav-link" to="/training">Training</Link></li>
                        <li><Link className="nav-link" to="/multiplayer">Multiplayer</Link></li>
                        <li><Link className="nav-link" to="/random">Random</Link></li>
                        <li><Link className="nav-link" to="/">Settings</Link></li>
                        {user && <li><Link className="nav-link" to="/">Profile</Link></li>}
                        {user && <li><div className="nav-link" onClick={handleLogout}>Sign out</div></li>}
                    </ul>
                </div>
        </nav>
    )
}