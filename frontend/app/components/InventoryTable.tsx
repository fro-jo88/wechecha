'use client';

import { useState } from 'react';
import { Package, Truck, MinusCircle, AlertTriangle } from 'lucide-react';
import { DeductModal, TransferModal } from './InventoryActionModals';

interface InventoryTableProps {
    inventory: any[];
    role: string; // 'SUPER_ADMIN', 'STORE_MANAGER', 'SITE_ENGINEER'
    refreshInventory: () => void;
}

export default function InventoryTable({ inventory, role, refreshInventory }: InventoryTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'consumable' | 'fixed'>('all');

    // Modals
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [deductModalOpen, setDeductModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);

    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'consumable' && item.product.mainCategory === 'CONSUMABLE_GOODS') ||
            (activeTab === 'fixed' && item.product.mainCategory === 'FIXED_ASSET');

        return matchesSearch && matchesTab;
    });

    const handleDeduct = (item: any) => {
        setSelectedItem(item);
        setDeductModalOpen(true);
    };

    const handleTransfer = (item: any) => {
        setSelectedItem(item);
        setTransferModalOpen(true);
    };

    return (
        <div>
            {/* Modals */}
            <DeductModal
                isOpen={deductModalOpen}
                onClose={() => setDeductModalOpen(false)}
                inventoryItem={selectedItem}
                onSuccess={refreshInventory}
            />
            <TransferModal
                isOpen={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                inventoryItem={selectedItem}
                onSuccess={refreshInventory}
            />

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>All</button>
                    <button onClick={() => setActiveTab('consumable')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'consumable' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Consumables</button>
                    <button onClick={() => setActiveTab('fixed')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'fixed' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Fixed Assets</button>
                </div>
                <input
                    type="text"
                    placeholder="Search inventory..."
                    className="pl-4 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInventory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                                {item.product.mainCategory === 'FIXED_ASSET' ? <Truck className="h-5 w-5 text-blue-500" /> : <Package className="h-5 w-5 text-green-500" />}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">{item.product.name}</div>
                                                <div className="text-sm text-gray-500">{item.product.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.product.mainCategory === 'FIXED_ASSET' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.product.mainCategory === 'FIXED_ASSET' ? 'Fixed Asset' : 'Consumable'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {item.location.name} <span className="text-gray-500 text-xs">({item.location.type})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                        {item.quantity} {item.product.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {item.product.mainCategory === 'CONSUMABLE_GOODS' && (
                                            <button
                                                onClick={() => handleDeduct(item)}
                                                className="text-red-600 hover:text-red-900 inline-flex items-center mr-4"
                                            >
                                                <MinusCircle className="h-4 w-4 mr-1" /> Use/Deduct
                                            </button>
                                        )}
                                        {/* Managers can transfer Assets. Super Admin surely can. */}
                                        <button
                                            onClick={() => handleTransfer(item)}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                        >
                                            <Truck className="h-4 w-4 mr-1" /> Transfer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No inventory records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
