import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useTableSort,
} from "../table";
import type { TableSortDirection } from "./tableTypes";

interface Employee {
  id: string;
  name: string;
  department: string;
  salary: number;
}

const mockData: Employee[] = [
  { id: "1", name: "Alice Smith", department: "Engineering", salary: 120000 },
  { id: "2", name: "Bob Johnson", department: "Design", salary: 95000 },
  { id: "3", name: "Charlie Brown", department: "Engineering", salary: 110000 },
  { id: "4", name: "Diana Prince", department: "Product", salary: 135000 },
];

/**
 * Example 1: Client-Side Sorting
 * The hook manages the sorting state and returns the sorted data array.
 */
export function ClientSideSortExample() {
  const { sortKey, sortDirection, handleSort, sortedData } = useTableSort<Employee>({
    data: mockData,
    initialSortKey: "name",
    initialSortDirection: "asc",
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Client-Side Sorting Example</h3>
      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead
              sortable
              sortKey="name"
              sortDirection={sortKey === "name" ? sortDirection : null}
              onSort={handleSort}
            >
              Employee Name
            </TableHead>
            <TableHead
              sortable
              sortKey="department"
              sortDirection={sortKey === "department" ? sortDirection : null}
              onSort={handleSort}
            >
              Department
            </TableHead>
            <TableHead
              sortable
              sortKey="salary"
              variant="currency"
              sortDirection={sortKey === "salary" ? sortDirection : null}
              onSort={handleSort}
            >
              Salary
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell>{emp.name}</TableCell>
              <TableCell>{emp.department}</TableCell>
              <TableCell variant="currency">${emp.salary.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Example 2: Server-Side Sorting (Controlled)
 * The component drives the state (e.g., from URL query parameters),
 * and the hook simply triggers callbacks.
 */
export function ServerSideSortExample() {
  // In a real app, these would come from URL search params (e.g., ?sort=salary&dir=desc)
  const [urlSortKey, setUrlSortKey] = React.useState<string>("salary");
  const [urlSortDir, setUrlSortDir] = React.useState<TableSortDirection | null>("desc");

  const { sortKey, sortDirection, handleSort } = useTableSort<Employee>({
    sortKey: urlSortKey,
    sortDirection: urlSortDir,
    onSort: (key, direction) => {
      // Here you would typically set URL search params to trigger a new server fetch
      setUrlSortKey(key);
      setUrlSortDir(direction);
    },
  });

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-lg font-semibold">Server-Side (Controlled) Sorting Example</h3>
      <p className="text-sm text-muted-foreground">
        Current API Query: <code className="bg-muted px-1 py-0.5 rounded">?sortBy={sortKey}&order={sortDirection ?? "none"}</code>
      </p>
      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead
              sortable
              sortKey="name"
              sortDirection={sortKey === "name" ? sortDirection : null}
              onSort={handleSort}
            >
              Employee Name
            </TableHead>
            <TableHead
              sortable
              sortKey="department"
              sortDirection={sortKey === "department" ? sortDirection : null}
              onSort={handleSort}
            >
              Department
            </TableHead>
            <TableHead
              sortable
              sortKey="salary"
              variant="currency"
              sortDirection={sortKey === "salary" ? sortDirection : null}
              onSort={handleSort}
            >
              Salary
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Data would normally be server-paginated and passed directly here */}
          {mockData.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell>{emp.name}</TableCell>
              <TableCell>{emp.department}</TableCell>
              <TableCell variant="currency">${emp.salary.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
