'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRequestPage() {
    const router = useRouter();
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        locationId: '',
        productId: '',
        quantity: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [storesRes, sitesRes, productsRes] = await Promise.all([
                    fetch('http://localhost:3001/api/stores', { headers }),
                    fetch('http://localhost:3001/api/sites', { headers }),
                    fetch('http://localhost:3001/api/products', { headers })
                ]);

                const stores = await storesRes.json();
                const sites = await sitesRes.json();
                const prods = await productsRes.json();

                setLocations([...(stores.data || []), ...(sites.data || [])]);
                setProducts(prods.data || []);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/inventory/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create request');
            }

            router.push('/dashboard/superadmin/requests');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6">Create Inventory Request</h1>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Location</label>
                        <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.locationId}
                            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                        >
                            <option value="">Select Location</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name} ({loc.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.productId}
                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                        >
                            <option value="">Select Product</option>
                            {products.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.name} ({prod.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                    >
                        Submit Request
                    </button>
                </form>
            </div>
        </div>
    );
}
