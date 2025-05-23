import React, { Suspense } from "react";
import { Routes, Route } from "react-router";
import NavigationBar from "./components/navigation/navigation-bar";
import { useAttendanceSocket } from "./hooks/useAttendanceSocket";

// Lazy-loaded pages
const Home = React.lazy(() => import("@/pages/Home"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Employees = React.lazy(() => import("@/pages/Employees"));
const Attendance = React.lazy(() => import("@/pages/Attendance"));
const Adjustments = React.lazy(() => import("@/pages/Adjustments"));

export default function App() {
    // Initialize the attendance socket connection
    useAttendanceSocket();

    return (
        <>
            <NavigationBar />
            <main className="pt-26">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full p-4">
                            <span>Loading...</span>
                        </div>
                    }
                >
                    <Routes>
                        <Route path='/' element={<Home />} />
                        <Route path='/dashboard' element={<Dashboard />} />
                        <Route path='/employees' element={<Employees />} />
                        <Route path='/attendance' element={<Attendance />} />
                        <Route path='/create-adjustments' element={<Adjustments />} />
                    </Routes>
                </Suspense>
            </main>
        </>
    );
}
