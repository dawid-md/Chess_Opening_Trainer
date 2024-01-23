import { Link } from "react-router-dom"

export default function Panel(){
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
                        <li><Link className="nav-link" to="/register">Register</Link></li>
                        <li><Link className="nav-link" to="/analysis">Analysis</Link></li>
                        <li><Link className="nav-link" to="/multiplayer">Multiplayer</Link></li>
                        <li><Link className="nav-link" to="/random">Random</Link></li>
                        <li><Link className="nav-link" to="/">Settings</Link></li>
                        <li><Link className="nav-link" to="/">Account</Link></li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}