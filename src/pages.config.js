import Analytics from './pages/Analytics';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Monitoring from './pages/Monitoring';
import ThreatIntel from './pages/ThreatIntel';


export const PAGES = {
    "Analytics": Analytics,
    "Home": Home,
    "Scanner": Scanner,
    "Monitoring": Monitoring,
    "ThreatIntel": ThreatIntel,
}

export const pagesConfig = {
    mainPage: "Scanner",
    Pages: PAGES,
};