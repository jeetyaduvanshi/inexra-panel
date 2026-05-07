'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ApiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const clients = ['Pure Spectrum', 'Torfac', 'Zampila'];

export function ApiSettingsModal({ isOpen, onClose, onSave }: ApiSettingsModalProps) {
    const [clientName, setClientName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/client-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    apiKey,
                    apiEndpoint: apiKey, // Using the API field for both key and endpoint
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to save configuration');
            }

            onSave();
            onClose();
            setClientName('');
            setApiKey('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Change Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Client Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client
                        </label>
                        <select
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-inexra-teal focus:border-transparent"
                            required
                        >
                            <option value="">Select a client...</option>
                            {clients.map((client) => (
                                <option key={client} value={client}>
                                    {client}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* API Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Api
                        </label>
                        <textarea
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-inexra-teal focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Paste your API Key or Endpoint here..."
                            required
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                💡 Enter <code className="bg-gray-100 px-1 rounded">TEST_MODE</code> to use mock data
                            </p>
                            <button
                                type="button"
                                onClick={() => setApiKey('TEST_MODE')}
                                className="text-xs text-inexra-teal hover:underline"
                            >
                                Use Test Mode
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-inexra-navy text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
