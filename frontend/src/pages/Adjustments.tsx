import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function Adjustments() {
    return (
        <div className="adjustments container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                <h1 className="text-3xl font-bold tracking-tight">Adjustments</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Adjustment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Employee</label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="emp1">John Doe</SelectItem>
                                        <SelectItem value="emp2">Jane Smith</SelectItem>
                                        <SelectItem value="emp3">Mark Johnson</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Adjustment Type</label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="overtime">Overtime</SelectItem>
                                            <SelectItem value="undertime">Undertime</SelectItem>
                                            <SelectItem value="leave">Leave</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                <span>Pick a date</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hours</label>
                                    <Input type="number" placeholder="Enter hours" min="0" step="0.5" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Minutes</label>
                                    <Input type="number" placeholder="Enter minutes" min="0" max="59" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason</label>
                                <Textarea placeholder="Enter reason for adjustment" rows={3} />
                            </div>

                            <Button type="submit" className="w-full">Create Adjustment</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Adjustments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((index) => (
                                <div key={index} className="flex justify-between items-start border-b pb-3">
                                    <div>
                                        <h3 className="font-medium">Employee {index}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {index === 1 ? "Overtime" : index === 2 ? "Leave" : "Undertime"} -
                                            {index === 1 ? "2 hours" : index === 2 ? "1 day" : "30 minutes"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(2023, 5, 15 + index), "MMMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline">Edit</Button>
                                        <Button size="sm" variant="outline" className="text-red-500">Delete</Button>
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" className="w-full">View All Adjustments</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}