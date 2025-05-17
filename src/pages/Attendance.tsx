import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Calendar as CalendarIcon, Search, Filter, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { format } from "date-fns";

// Sample data for demonstration
const attendanceData = [
    { id: 1, employeeId: "EMP-1001", name: "John Doe", date: new Date(2023, 4, 15), timeIn: "08:03 AM", timeOut: "05:02 PM", status: "On Time" },
    { id: 2, employeeId: "EMP-1002", name: "Jane Smith", date: new Date(2023, 4, 15), timeIn: "08:30 AM", timeOut: "05:45 PM", status: "On Time" },
    { id: 3, employeeId: "EMP-1003", name: "Mark Johnson", date: new Date(2023, 4, 15), timeIn: "09:15 AM", timeOut: "06:00 PM", status: "Late" },
    { id: 4, employeeId: "EMP-1001", name: "John Doe", date: new Date(2023, 4, 16), timeIn: "07:55 AM", timeOut: "05:10 PM", status: "On Time" },
    { id: 5, employeeId: "EMP-1002", name: "Jane Smith", date: new Date(2023, 4, 16), timeIn: "08:45 AM", timeOut: "05:30 PM", status: "Late" },
    { id: 6, employeeId: "EMP-1004", name: "Sarah Williams", date: new Date(2023, 4, 16), timeIn: "08:02 AM", timeOut: "04:55 PM", status: "On Time" },
    { id: 7, employeeId: "EMP-1005", name: "Robert Brown", date: new Date(2023, 4, 16), timeIn: "08:10 AM", timeOut: "05:05 PM", status: "On Time" },
];

// Form schema for date selection
const FormSchema = z.object({
    date: z.date().optional(),
    searchQuery: z.string().optional(),
    status: z.string().optional(),
});

export default function Attendance() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            searchQuery: "",
            status: "all",
            date: undefined,
        },
    });

    const [records, setRecords] = useState(attendanceData);

    const onSubmit = (data: z.infer<typeof FormSchema>) => {
        console.log("Form submitted with data:", data);
        // Filter data based on form values
        let filtered = [...attendanceData];

        if (data.searchQuery) {
            const query = data.searchQuery.toLowerCase();
            filtered = filtered.filter(record =>
                record.name.toLowerCase().includes(query) ||
                record.employeeId.toLowerCase().includes(query)
            );
        }

        if (data.date) {
            const selectedDate = new Date(data.date);
            filtered = filtered.filter(record =>
                record.date.getDate() === selectedDate.getDate() &&
                record.date.getMonth() === selectedDate.getMonth() &&
                record.date.getFullYear() === selectedDate.getFullYear()
            );
        }

        if (data.status && data.status !== 'all') {
            filtered = filtered.filter(record =>
                record.status.toLowerCase() === data.status?.toLowerCase().replace('-', ' ')
            );
        }

        setRecords(filtered);
    };

    const handleResetFilters = () => {
        form.reset({
            searchQuery: "",
            status: "all",
            date: undefined,
        });
        setRecords(attendanceData);
    };

    return (
        <div className="attendance container mx-auto p-6">
            <div className="flex items-center gap-2 mb-6">
                <Clock className="h-6 w-6 text-indigo-600" />
                <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Daily Attendance</CardTitle>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="flex flex-wrap gap-4 mb-6">
                                <div className="flex items-center gap-2 w-full max-w-xs">
                                    <FormField
                                        control={form.control}
                                        name="searchQuery"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Search employee..." {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button size="icon" variant="ghost" type="button" onClick={() => form.trigger("searchQuery")}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-[240px] pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                console.log("Date selected:", date);
                                                                field.onChange(date);
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-[150px]">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="all">All</SelectItem>
                                                        <SelectItem value="on-time">On Time</SelectItem>
                                                        <SelectItem value="late">Late</SelectItem>
                                                        <SelectItem value="absent">Absent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <Button size="sm" variant="outline" type="submit">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filter
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        type="button"
                                        onClick={handleResetFilters}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time In</TableHead>
                                <TableHead>Time Out</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.employeeId}</TableCell>
                                        <TableCell>{record.name}</TableCell>
                                        <TableCell>{format(record.date, "MMM dd, yyyy")}</TableCell>
                                        <TableCell>{record.timeIn}</TableCell>
                                        <TableCell>{record.timeOut}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${record.status === "On Time"
                                                ? "bg-green-100 text-green-800"
                                                : record.status === "Late"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}>
                                                {record.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline">View</Button>
                                                <Button size="sm" variant="outline">Edit</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                        No records found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{records.length}</span> of <span className="font-medium">{attendanceData.length}</span> records
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">On Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">76%</div>
                        <p className="text-xs text-muted-foreground">+2% from last week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18%</div>
                        <p className="text-xs text-muted-foreground">-1% from last week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">6%</div>
                        <p className="text-xs text-muted-foreground">-1% from last week</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 