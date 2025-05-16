import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, UserPlus, Filter } from "lucide-react";

export default function Employees() {
    return (
        <div className="employees container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-indigo-600" />
                <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Employee Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 w-full max-w-sm">
                            <Input placeholder="Search employees..." />
                            <Button size="icon" variant="ghost">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                            <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((row) => (
                                <TableRow key={row}>
                                    <TableCell>EMP-{1000 + row}</TableCell>
                                    <TableCell>Employee {row}</TableCell>
                                    <TableCell>{row % 2 === 0 ? "IT" : "HR"}</TableCell>
                                    <TableCell>{row % 3 === 0 ? "Manager" : "Staff"}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${row % 4 === 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                            {row % 4 === 0 ? "Inactive" : "Active"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline">View</Button>
                                            <Button size="sm" variant="outline">Edit</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-end mt-4 space-x-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}