'use client';

import { X, Package, Tag, DollarSign, Ruler } from 'lucide-react';

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
}

export default function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Product Details
                                </h3>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-base text-gray-900 font-semibold">{product.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">SKU</label>
                                            <p className="text-sm text-gray-900 font-mono">{product.sku}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Status</label>
                                            <p className={`text-sm font-bold ${product.status === 'APPROVED' ? 'text-green-600' :
                                                    product.status === 'PENDING_APPROVAL' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {product.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Category</label>
                                            <p className="text-sm text-gray-900">{product.category}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Main Category</label>
                                            <p className="text-sm text-gray-900">{product.mainCategory?.replace('_', ' ')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Price</label>
                                            <p className="text-sm text-gray-900">{product.price?.toLocaleString()} ETB</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Unit</label>
                                            <p className="text-sm text-gray-900">{product.unit}</p>
                                        </div>
                                    </div>

                                    {product.description && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Description</label>
                                            <p className="text-sm text-gray-700">{product.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
