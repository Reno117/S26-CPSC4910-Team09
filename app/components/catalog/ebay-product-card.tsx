"use client";

import { useState } from "react";
import { addProductToCatalog } from "@/app/actions/sponsor/catalog/add-product";

interface EbayProductCardProps {
  product: {
    itemId: string;
    title: string;
    price: number;
    imageUrl: string;
  };
  sponsorId: string;
  onAdded: (itemId: string) => void;
}

export default function EbayProductCard({
  product,
  sponsorId,
  onAdded,
}: EbayProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Convert price to points (assuming $0.01 per point)
  const pointPrice = Math.ceil(product.price / 0.01);

  const handleAdd = async () => {
    setError("");
    setAdding(true);

    try {
      await addProductToCatalog({
        ebayItemId: product.itemId,
        title: product.title,
        imageUrl: product.imageUrl,
        price: product.price, // ADD THIS
        sponsorId: sponsorId,
      });

      onAdded(product.itemId);
    } catch (err: any) {
      setError(err.message || "Failed to add product");
      setAdding(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <svg
              className="w-16 h-16 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base mb-3 line-clamp-2 h-12">
          {product.title}
        </h3>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">
            eBay Price: ${product.price.toFixed(2)}
          </p>
          <p className="text-2xl font-bold text-green-600">
            {pointPrice.toLocaleString()} points
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {adding ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adding...
            </span>
          ) : (
            "Add to Catalog"
          )}
        </button>
      </div>
    </div>
  );
}
