export default function Panel({changeVariant}){
    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="#">Home</a>
                    </li>
                    <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Variant
                    </a>
                    <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#" onClick={() => changeVariant("Random")}>Random Move Engine</a></li>
                        <li><a className="dropdown-item" href="#" onClick={() => changeVariant("Multiplayer")}>Multiplayer</a></li>
                        <li><a className="dropdown-item" href="#" onClick={() => changeVariant("Analysis")}>Analysis</a></li>
                    </ul>
                    </li>
                </ul>
                </div>
            </div>
        </nav>
    )
}