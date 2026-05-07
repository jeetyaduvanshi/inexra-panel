"use client";

import React, { useState } from "react";
import { Search, RefreshCcw, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";

interface User {
    id: number;
    sn: number;
    name: string;
    mobile: string;
    role: "Admin" | "Project Manager" | "Sales Manager" | "User";
    email: string;
    password: string; // Dummy password for display as per reference
}

const dummyUsers: User[] = [];

export function UsersList() {
    const [users, setUsers] = useState<User[]>(dummyUsers);
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State
    const [newUser, setNewUser] = useState<Partial<User>>({
        role: "User",
    });

    

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate Add
        const id = users.length + 101;
        const sn = users.length + 1;
        const userToAdd = {
            ...newUser,
            id,
            sn,
            password: newUser.password || "123456"
        } as User;

        setUsers([...users, userToAdd]);
        setIsAddOpen(false);
        setNewUser({ role: "User" }); // Reset
    };

    return (
        <div className="space-y-6">

            {/* Page Header Area */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-inexra-navy">USERS</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-inexra-teal hover:bg-teal-500 text-white font-bold">
                            Add <Plus className="w-4 h-4 ml-1" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">User Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        required
                                        placeholder="Enter full name"
                                        value={newUser.name || ""}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="mobile"
                                        required
                                        placeholder="Enter mobile"
                                        value={newUser.mobile || ""}
                                        onChange={e => setNewUser({ ...newUser, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        value={newUser.email || ""}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="password"
                                        type="text"
                                        required
                                        placeholder="Create password"
                                        value={newUser.password || ""}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                                    <Select
                                        onValueChange={(val: string) => setNewUser({ ...newUser, role: val as User["role"] })}
                                        defaultValue={newUser.role}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Project Manager">Project Manager</SelectItem>
                                            <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                            <SelectItem value="User">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-inexra-navy hover:bg-blue-900 text-white">Submit</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">User Name</Label>
                        <Input placeholder="Search By User Name" className="h-10 text-xs bg-gray-50/50" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Mobile Number</Label>
                        <Input placeholder="Search By Mobile Number" className="h-10 text-xs bg-gray-50/50" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Email</Label>
                        <Input placeholder="Search By Email" className="h-10 text-xs bg-gray-50/50" />
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-amber-400 hover:bg-amber-500 text-black font-bold h-10 px-6">
                            Search <Search className="w-4 h-4 ml-2" />
                        </Button>
                        <Button variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white font-bold h-10 px-4">
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                    <span className="text-sm font-semibold text-gray-700">Showing 1 - {users.length} of {users.length}</span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[60px] font-bold text-xs text-secondary-foreground uppercase">SN</TableHead>
                            <TableHead className="font-bold text-xs text-secondary-foreground uppercase">User Name</TableHead>
                            <TableHead className="font-bold text-xs text-secondary-foreground uppercase">Mobile No.</TableHead>
                            <TableHead className="font-bold text-xs text-secondary-foreground uppercase">Role</TableHead>
                            <TableHead className="font-bold text-xs text-secondary-foreground uppercase">Email</TableHead>
                            <TableHead className="font-bold text-xs text-secondary-foreground uppercase">Password</TableHead>
                            <TableHead className="text-right font-bold text-xs text-secondary-foreground uppercase">#</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-blue-50/20">
                                <TableCell className="text-xs font-medium text-gray-600">{user.sn}</TableCell>
                                <TableCell className="text-xs text-gray-700">{user.name}</TableCell>
                                <TableCell className="text-xs text-gray-600">{user.mobile}</TableCell>
                                <TableCell className="text-xs text-gray-600">{user.role}</TableCell>
                                <TableCell className="text-xs text-blue-600 hover:underline cursor-pointer">{user.email}</TableCell>
                                <TableCell className="text-xs text-gray-500 font-mono">{user.password}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="sm" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 w-14">Edit</Button>
                                        <Button size="sm" className="h-7 text-[10px] bg-red-500 hover:bg-red-600 w-14">Delete</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
