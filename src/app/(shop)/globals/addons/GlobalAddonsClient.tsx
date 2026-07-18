"use client";

import React, { useState } from "react";
import { PlusIcon, GridIcon, PencilIcon } from "@/icons/index";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { createGlobalAddon, updateGlobalAddon } from "@/lib/actions/globals";

export default function GlobalAddonsClient({
    initialAddons,
}: {
    initialAddons: any[];
}) {
    const [addons, setAddons] = useState(initialAddons);
    const [search, setSearch] = useState("");
    const { isOpen, openModal, closeModal } = useModal();

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [newName, setNewName] = useState("");
    const [applyMarkup, setApplyMarkup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filtered = addons.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setNewName("");
        setApplyMarkup(false);
        openModal();
    };

    const openEditModal = (addon: any) => {
        setIsEditMode(true);
        setEditingId(addon.globalAddonId);
        setNewName(addon.name);
        setApplyMarkup(!!addon.applyMarkup);
        openModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            setIsSubmitting(true);

            if (isEditMode && editingId) {
                const updated = await updateGlobalAddon(editingId, {
                    name: newName,
                    applyMarkup,
                });
                setAddons((prev) =>
                    prev.map((a) => (a.globalAddonId === editingId ? updated : a))
                );
            } else {
                const newAddon = await createGlobalAddon({
                    name: newName,
                    applyMarkup,
                });
                setAddons([...addons, newAddon]);
            }

            closeModal();
        } catch (err: any) {
            alert(err.message || "Failed to save addon");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-6">
                <div className="max-w-[300px] w-full">
                    <Input
                        placeholder="Search addons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={openCreateModal} className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Global Addon
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
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Markup Rules
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400"
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="px-5 py-20 text-center text-gray-500"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <GridIcon className="w-10 h-10 text-gray-200" />
                                        <span className="text-gray-400 font-medium">
                                            No global addons found.
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((addon) => (
                                <tr
                                    key={addon.globalAddonId}
                                    className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                >
                                    <TableCell className="px-5 py-4 text-start">
                                        <span className="text-sm text-gray-500 font-mono dark:text-gray-400">
                                            {addon.globalAddonId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-5 py-4 text-start">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                                            {addon.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-5 py-4 text-start">
                                        {addon.applyMarkup ? (
                                            <Badge color="primary">Subject to Markup</Badge>
                                        ) : (
                                            <Badge color="light">Excluded</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => openEditModal(addon)}
                                            className="text-brand-500 hover:text-brand-600 transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
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
                className="max-w-[450px] p-6 lg:p-8"
            >
                <h4 className="font-semibold text-gray-800 mb-6 text-title-sm dark:text-white/90">
                    {isEditMode ? "Edit Addon" : "Create Global Addon"}
                </h4>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Addon Name
                        </label>
                        <Input
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., Comfort / Steam Ironing"
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4 border border-gray-100 dark:border-white/[0.05]">
                        <Checkbox
                            label="Apply Tiered Markup"
                            checked={applyMarkup}
                            onChange={setApplyMarkup}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8 leading-relaxed">
                            If enabled, the app platform fee will inflate this addon's price
                            dynamically during checkout. Leave disabled for fixed-price
                            standard items (like liquids).
                        </p>
                    </div>

                    <div className="flex items-center justify-end w-full gap-3 mt-8">
                        <Button variant="outline" onClick={closeModal} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Addon"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
