// pages/Attendance.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { format } from "date-fns";

import { useAttendanceStore } from "@/store/attendanceStore";
import type { AttendanceLog } from "@/store/attendanceStore";

// ------------- Form schema -------------
const FormSchema = z.object({
  date: z.date().optional(),
  searchQuery: z.string().optional(),
  status: z.enum(["all", "on time", "late", "absent"]).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

export default function Attendance() {
  // — Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { searchQuery: "", status: "all", date: undefined },
  });

  // — Kick off socket + store
  const allLogs = useAttendanceStore((s) => s.logs);

  // — UI state: filtered records + loading flag
  const [records, setRecords] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // — When first data arrives, clear loading and set unfiltered records
  useEffect(() => {
    if (allLogs.length > 0) {
      setLoading(false);
      const { searchQuery, date, status } = form.getValues();
      const noFilter = !searchQuery && !date && status === "all";
      if (noFilter) {
        setRecords(allLogs);
      }
    }
  }, [allLogs, form]);

  // — Filter handler
  const onSubmit = (data: FormValues) => {
    let filtered = [...allLogs];

    if (data.searchQuery) {
      const q = data.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q)
      );
    }

    if (data.date) {
      const target = data.date.toISOString().slice(0, 10); // "YYYY-MM-DD"
      filtered = filtered.filter((r) => r.date === target);
    }

    if (data.status && data.status !== "all") {
      filtered = filtered.filter((r) => r.status.toLowerCase() === data.status);
    }

    setRecords(filtered);
  };

  const handleResetFilters = () => {
    form.reset({ searchQuery: "", status: "all", date: undefined });
    setRecords(allLogs);
  };

  // — Loader UI while waiting
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Fetching attendance records…</p>
      </div>
    );
  }

  // — Main UI
  return (
    <div className="attendance container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-indigo-600" />
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Records
        </h1>
      </div>

      {/* --- Filter / Export Card --- */}
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
                {/* Search */}
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => form.trigger("searchQuery")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Date picker */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? format(field.value, "PPP")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
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

                {/* Status select */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="on time">On Time</SelectItem>
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
            </form>
          </Form>

          {/* --- Attendance Table --- */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Status</TableHead>
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? (
                records.map((r) => (
                  <TableRow key={`${r.employeeId}-${r.date}`}>
                    <TableCell>{r.employeeId}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {format(new Date(r.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{r.dayOfWeek}</TableCell>
                    <TableCell>{r.timeIn ?? "—"}</TableCell>
                    <TableCell>{r.timeOut ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          r.status === "On Time"
                            ? "bg-blue-100 text-blue-800"
                            : r.status === "Early"
                            ? "bg-green-100 text-green-800"
                            : r.status === "Late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* --- Pagination / Summary --- */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{records.length}</span> of{" "}
              <span className="font-medium">{allLogs.length}</span> records
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Summary Cards --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (allLogs.filter((r) => r.status === "On Time").length /
                  allLogs.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (allLogs.filter((r) => r.status === "Late").length /
                  allLogs.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">-1% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (allLogs.filter((r) => r.status === "Absent").length /
                  allLogs.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">-1% from last week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
