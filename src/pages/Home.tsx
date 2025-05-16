import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon } from "lucide-react";

export default function Home() {
    return (
        <div className="home container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <HomeIcon className="h-6 w-6 text-indigo-600" />
                <h1 className="text-3xl font-bold tracking-tight">Welcome to the Home Page</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Access</CardTitle>
                        <CardDescription>Access frequently used features</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Get started by navigating to the dashboard or check employee records.</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline">Learn More</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your recent system activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="text-sm">Updated employee records</li>
                            <li className="text-sm">Processed attendance data</li>
                            <li className="text-sm">Created new adjustment entry</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline">View All</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>Current system information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm">Database</span>
                                <span className="text-sm font-medium text-green-600">Online</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">ZKTeco Connection</span>
                                <span className="text-sm font-medium text-green-600">Connected</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Last Sync</span>
                                <span className="text-sm">Today, 09:45 AM</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline">Refresh</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}