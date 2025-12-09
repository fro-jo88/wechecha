'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

interface DeductModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryItem: any;
    onSuccess: () => void;
}

export function DeductModal({ isOpen, onClose, inventoryItem, onSuccess }: DeductModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !inventoryItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.inventory.adjust({
                inventoryId: inventoryItem.id,
                quantity: quantity,
                reason
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to deduct inventory:', error);
            alert('Failed to update inventory. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Deduct / Usage: {inventoryItem.product.name}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Quantity to Deduct</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={inventoryItem.quantity}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">Available: {inventoryItem.quantity} {inventoryItem.product.unit}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Reason (Optional)</label>
                                <textarea
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Daily usage, Damaged, etc."
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                {loading ? 'Processing...' : 'Deduct'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryItem: any;
    onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, inventoryItem, onSuccess }: TransferModalProps) {
    const [targetLocationId, setTargetLocationId] = useState('');
    const [quantity, setQuantity] = useState('1'); // Strings for form inputs, parsed later
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
        }
    }, [isOpen]);

    const fetchLocations = async () => {
        // Fetch Stores and Sites
        // TODO: We need an endpoint to list all available locations (Stores + Sites) to transfer TO.
        // For now, let's fetch stores and sites separately or use a combined endpoint if available.
        // Dashboard stats usually don't give list.
        // Let's assume we can fetch stores and sites.
        try {
            const [storesRes, sitesRes] = await Promise.all([
                apiClient.stores.getAll(),
                apiClient.sites.getAll()
            ]);
            const allLocations = [
                ...(storesRes.data || []).map((s: any) => ({ ...s, type: 'STORE' })),
                ...(sitesRes.data || []).map((s: any) => ({ ...s, type: 'SITE' }))
            ].filter(loc => loc.id !== inventoryItem.locationId); // Exclude current location

            setLocations(allLocations);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    if (!isOpen || !inventoryItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.inventory.transfer({
                inventoryId: inventoryItem.id,
                targetLocationId: parseInt(targetLocationId),
                quantity: inventoryItem.product.mainCategory === 'FIXED_ASSET' ? 1 : parseInt(quantity),
                reason
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to transfer asset:', error);
            alert('Transfer failed. Please check inputs and try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFixedAsset = inventoryItem.product.mainCategory === 'FIXED_ASSET';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Transfer {isFixedAsset ? 'Asset' : 'Inventory'}: {inventoryItem.product.name}
                            </h3>

                            {!isFixedAsset && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Quantity to Transfer</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={inventoryItem.quantity}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Available: {inventoryItem.quantity}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Target Location</label>
                                <select
                                    value={targetLocationId}
                                    onChange={(e) => setTargetLocationId(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="">Select Destination...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Reason (Optional)</label>
                                <textarea
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Allocation to site, Store transfer"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                {loading ? 'Transferring...' : 'Transfer'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
