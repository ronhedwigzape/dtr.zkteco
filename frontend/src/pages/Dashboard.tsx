import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Clock, UserCheck, UserX } from "lucide-react";

export default function Dashboard() {
    
    return (
        <div className="dashboard container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">152</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">124</div>
                        <p className="text-xs text-muted-foreground">81.6% of total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">28</div>
                        <p className="text-xs text-muted-foreground">18.4% of total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Work Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">7.5h</div>
                        <p className="text-xs text-muted-foreground">+0.2h from last week</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                Attendance chart will appear here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="attendance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Attendance Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                Daily attendance log will appear here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                Reports will appear here
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}