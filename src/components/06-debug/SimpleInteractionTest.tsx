"use client";

import { useState } from 'react';

export default function SimpleInteractionTest() {
    const [rating, setRating] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [notes, setNotes] = useState('');

    const contractAddress = "0x8f3D90b0c63ce3b7e6Db95e12F3b10Ab1e3b8c2a";
    const tokenId = "1";

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    NFT User Interaction Test
                </h1>

                <div className="space-y-6">
                    {/* NFT Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h2 className="font-medium text-gray-900 mb-2">NFT Details</h2>
                        <p className="text-sm text-gray-600">Contract: {contractAddress}</p>
                        <p className="text-sm text-gray-600">Token ID: {tokenId}</p>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personal Rating
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-2xl ${star <= rating
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        } hover:text-yellow-400 transition-colors`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            Current rating: {rating}/5
                        </p>
                    </div>

                    {/* Favorite & Watchlist */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isFavorite
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            <span className="text-lg">
                                {isFavorite ? '❤️' : '🤍'}
                            </span>
                            <span>
                                {isFavorite ? 'Favorited' : 'Add to Favorites'}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsWatchlisted(!isWatchlisted)}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isWatchlisted
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            <span className="text-lg">
                                {isWatchlisted ? '👁️' : '👀'}
                            </span>
                            <span>
                                {isWatchlisted ? 'Watching' : 'Add to Watchlist'}
                            </span>
                        </button>
                    </div>

                    {/* Personal Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personal Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your personal notes about this NFT..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                        />
                    </div>

                    {/* Action Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Current Status</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Rating: {rating > 0 ? `${rating}/5 stars` : 'Not rated'}</li>
                            <li>• Favorite: {isFavorite ? 'Yes' : 'No'}</li>
                            <li>• Watchlisted: {isWatchlisted ? 'Yes' : 'No'}</li>
                            <li>• Notes: {notes.length > 0 ? `${notes.length} characters` : 'None'}</li>
                        </ul>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={() => {
                            alert(`Interaction data:\nRating: ${rating}\nFavorite: ${isFavorite}\nWatchlist: ${isWatchlisted}\nNotes: ${notes}`);
                        }}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        💾 Save Interaction Data
                    </button>
                </div>
            </div>
        </div>
    );
}