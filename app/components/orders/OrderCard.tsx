"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/actions/sponsor/order-actions";
import { useRouter } from "next/navigation";
import CancelOrderButton from "./cancel-order-button";

type OrderWithRelations = {
  id: string;
  driverProfileId: string;
  driverProfile: {
    user: {
      name: string;
    };
  };
  sponsorId: string;
  totalPoints: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    title: string;
    quantity: number;
  }[];
  sponsor?: {
    name: string;
  };
};

// What status transitions are allowed
const allowedTransitions: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const statusLabels: Record<string, string> = {
  processing: "Accept (Processing)",
  shipped: "Mark as Shipped",
  delivered: "Mark as Delivered",
  cancelled: "Cancel Order",
};

interface OrderCardProps {
  order: OrderWithRelations;
  isAdmin?: boolean;
}

export default function OrderCard({ order, isAdmin = false }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const router = useRouter();

  const transitions = allowedTransitions[order.status] || [];
  const canCancel = order.status === "pending" || order.status === "processing";

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, newStatus as any);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to update order");
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-md bg-white mb-4">
      {/* Header with driver name and status - UNCHANGED */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">{order.driverProfile.user.name}</h3>
          {/* Admin: show sponsor name */}
          {isAdmin && order.sponsor && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              {order.sponsor.name}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {order.status}
        </span>
      </div>

      {/* Items list - UNCHANGED */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
        <ul className="space-y-2">
          {order.items.map(item => (
            <li key={item.id} className="flex justify-between text-gray-600">
              <span>{item.title}</span>
              <span>Qty: {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total - UNCHANGED */}
      <div className="border-t pt-4 flex justify-between items-center">
        <span className="font-medium">Total:</span>
        <span className="text-lg font-bold text-blue-600">
          {order.totalPoints} points
        </span>
      </div>

      {/* Order date + cancel button - UNCHANGED */}
      <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
        Ordered: {new Date(order.createdAt).toLocaleDateString()}
        <CancelOrderButton orderId={order.id} canCancel={canCancel} />
      </div>

      {/* NEW: Sponsor/Admin Status Management */}
      {transitions.length > 0 && (
        <div className="border-t mt-4 pt-4">
          {showConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                {showConfirm === "cancelled"
                  ? "⚠️ Cancel this order? Points will be refunded to the driver."
                  : `Move order to "${showConfirm}"?`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(showConfirm)}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white transition disabled:bg-gray-400 ${
                    showConfirm === "cancelled"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Updating..." : "Confirm"}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">UPDATE STATUS:</p>
              <div className="flex flex-wrap gap-2">
                {transitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setShowConfirm(status)}
                    disabled={loading}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                      status === "cancelled"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : status === "processing"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {statusLabels[status] || status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed/Cancelled - no actions available */}
      {transitions.length === 0 && (
        <div className="border-t mt-4 pt-4">
          <p className="text-sm text-gray-500 italic">
            {order.status === "delivered" ? "✅ Order completed" : "❌ Order cancelled"}
          </p>
        </div>
      )}
    </div>
  );
}