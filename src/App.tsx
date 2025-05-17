import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Dashboard from './pages/Dashboard';
import Employees from "./pages/Employees";
import Adjustments from "./pages/Adjustments";
import Attendance from "./pages/Attendance";
import NavigationBar from "./components/navigation/navigation-bar";

export default function App() {

    return (
        <>
            <NavigationBar />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/employees' element={<Employees />} />
                <Route path='/attendance' element={<Attendance />} />
                <Route path='/create-adjustments' element={<Adjustments />} />
            </Routes>
        </>
    )
}

