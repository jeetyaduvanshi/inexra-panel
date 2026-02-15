"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export interface Entity {
    id: number;
    sn: number;
    name: string;
    email: string;
    contactPerson: string;
    number: string;
    paymentTerm: string;
}

interface CommonListProps {
    title: string;
    data: Entity[];
    type: "Client" | "Vendor";
}

export function CommonList({ title, data, type }: CommonListProps) {
    const [entities, setEntities] = useState<Entity[]>(data);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newEntity, setNewEntity] = useState<Partial<Entity>>({});

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const id = entities.length + 1;
        const sn = entities.length + 1;
        setEntities([...entities, { ...newEntity, id, sn } as Entity]);
        setIsAddOpen(false);
        setNewEntity({});
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-inexra-navy uppercase">{title}</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-inexra-teal hover:bg-teal-500 text-white font-bold">
                            Add <Plus className="w-4 h-4 ml-1" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New {type}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>{type} Name <span className="text-red-500">*</span></Label>
                                    <Input required value={newEntity.name || ""} onChange={e => setNewEntity({ ...newEntity, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Person <span className="text-red-500">*</span></Label>
                                    <Input required value={newEntity.contactPerson || ""} onChange={e => setNewEntity({ ...newEntity, contactPerson: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile Number <span className="text-red-500">*</span></Label>
                                    <Input required value={newEntity.number || ""} onChange={e => setNewEntity({ ...newEntity, number: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" required value={newEntity.email || ""} onChange={e => setNewEntity({ ...newEntity, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Term <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={v => setNewEntity({ ...newEntity, paymentTerm: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 Days</SelectItem>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="45">45 Days</SelectItem>
                                            <SelectItem value="60">60 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-inexra-navy text-white">Submit</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Simple Search bar for clients/vendors */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input placeholder={`Search ${type}`} className="h-10 text-xs bg-gray-50/50" />
                    <Button className="w-fit bg-amber-400 hover:bg-amber-500 text-black font-bold h-10 px-6">
                        Search <Search className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                    <span className="text-sm font-semibold text-gray-700">All {title}</span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px] font-bold text-xs">SN</TableHead>
                            <TableHead className="font-bold text-xs">NAME</TableHead>
                            <TableHead className="font-bold text-xs">EMAIL</TableHead>
                            <TableHead className="font-bold text-xs">CONTACT PERSON</TableHead>
                            <TableHead className="font-bold text-xs">NUMBER</TableHead>
                            <TableHead className="font-bold text-xs">PAYMENT TERM</TableHead>
                            <TableHead className="text-right font-bold text-xs">#</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entities.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="text-xs font-medium text-gray-600">{item.sn}</TableCell>
                                <TableCell className="text-xs text-gray-700">{item.name}</TableCell>
                                <TableCell className="text-xs text-blue-600">{item.email}</TableCell>
                                <TableCell className="text-xs text-gray-600">{item.contactPerson}</TableCell>
                                <TableCell className="text-xs text-gray-600">{item.number}</TableCell>
                                <TableCell className="text-xs text-gray-600">{item.paymentTerm}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="sm" className="h-7 text-[10px] bg-blue-600 w-14">Edit</Button>
                                        <Button size="sm" className="h-7 text-[10px] bg-red-500 w-14">Delete</Button>
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
