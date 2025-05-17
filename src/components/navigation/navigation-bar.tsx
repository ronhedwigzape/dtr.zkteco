import { Link } from "react-router-dom";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Home, LayoutDashboard, Users, FileSpreadsheet, Clock } from "lucide-react";

const menuItems = [
    { path: "/", label: "Home", icon: <Home className="mr-3 h-5 w-5" /> },
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/employees", label: "Employees", icon: <Users className="mr-3 h-5 w-5" /> },
    { path: "/attendance", label: "Attendance", icon: <Clock className="mr-3 h-5 w-5" /> },
    { path: "/create-adjustments", label: "Adjustments", icon: <FileSpreadsheet className="mr-3 h-5 w-5" /> },
];

export default function NavigationBar() {
    return (
        <>
            <div className="fixed top-0 left-0 w-screen bg-indigo-950">
                <NavigationMenu className="w-screen py-3">
                    <img className="px-5 h-7" src="./assets/gvs-white-logo.png" alt="GVS White Logo" />
                </NavigationMenu>
            </div>

            <NavigationMenu className="mt-16 mx-4">
                <NavigationMenuList>
                    {menuItems.map((item) => (
                        <NavigationMenuItem key={item.path} className="px-1">
                            <Link to={item.path}>
                                <NavigationMenuLink className="font-bold text-gray-700">
                                    <div className="flex items-center text-center">
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </>
    );
} 