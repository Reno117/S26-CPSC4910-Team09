"use client";

import { useState } from "react";
import CatalogActions from "./catalog-actions";
import EditTitleModal from "./edit-title-modal";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    isActive: boolean;
    price: number;
    ebayItemId: string;
    sponsor: {
      name: string;
      pointValue: number;
    };
  };
  isAdmin: boolean;
}

function normalizeExternalImageUrl(url: string | null): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return null;
  }

  return `https://${trimmed}`;
}

export default function ProductCard({ product, isAdmin }: ProductCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const safeImageUrl = normalizeExternalImageUrl(product.imageUrl);

  return (
    <>
      <div
        className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
          !product.isActive ? "opacity-60" : ""
        }`}
      >
        {/* Image */}
        <div className="h-48 bg-gray-100 flex items-center justify-center relative">
          {safeImageUrl ? (
            <img
              src={safeImageUrl}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-sm">No image</div>
          )}
          {!product.isActive && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              Inactive
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {isAdmin && (
            <p className="text-xs text-blue-600 font-semibold mb-2">
              {product.sponsor.name}
            </p>
          )}

          <h3
            onClick={() => setIsEditModalOpen(true)}
            className="font-semibold text-base mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition"
            title="Click to edit"
          >
            {product.title}
          </h3>

          <h3 className="font-semibold text-base mb-2 line-clamp-2">
            {product.price / product.sponsor.pointValue} Points
          </h3>

          <p className="text-xs text-gray-400 mb-3">
            eBay ID: {product.ebayItemId}
          </p>

          {/* Actions */}
          <CatalogActions
            productId={product.id}
            isActive={product.isActive}
          />
        </div>
      </div>

      <EditTitleModal
        productId={product.id}
        currentTitle={product.title}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}