"use client";

import React, { useState } from "react";
import { PlusIcon, GridIcon } from "@/icons/index";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { createGlobalService } from "@/lib/actions/globals";

export default function GlobalServicesClient({
    initialServices,
}: {
    initialServices: any[];
}) {
    const [services, setServices] = useState(initialServices);
    const [search, setSearch] = useState("");
    const { isOpen, openModal, closeModal } = useModal();
    const [newName, setNewName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filtered = services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            setIsSubmitting(true);
            const newSvc = await createGlobalService(newName);
            setServices([...services, newSvc]);
            setNewName("");
            closeModal();
        } catch (err: any) {
            alert(err.message || "Failed to create");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-6">
                <div className="max-w-[300px] w-full">
                    <Input
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={openModal} className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Global Service
                </Button>
            </div>

            <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                ID
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Name
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    className="px-5 py-20 text-center text-gray-500"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <GridIcon className="w-10 h-10 text-gray-200" />
                                        <span className="text-gray-400 font-medium">
                                            No global services found.
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((svc) => (
                                <tr
                                    key={svc.globalServiceId}
                                    className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                >
                                    <TableCell className="px-5 py-4 text-start">
                                        <span className="text-sm text-gray-500 font-mono dark:text-gray-400">
                                            {svc.globalServiceId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-5 py-4 text-start">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                                            {svc.name}
                                        </span>
                                    </TableCell>
                                </tr>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-[400px] p-6 lg:p-8"
            >
                <h4 className="font-semibold text-gray-800 mb-6 text-title-sm dark:text-white/90">
                    Create Global Service
                </h4>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Service Name
                        </label>
                        <Input
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Wash & Fold"
                        />
                    </div>

                    <div className="flex items-center justify-end w-full gap-3 mt-8">
                        <Button variant="outline" onClick={closeModal} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Service"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
