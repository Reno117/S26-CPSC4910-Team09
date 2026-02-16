import { prisma } from "@/lib/prisma";
import CancelOrderButton from "./cancel-order-button";

type OrderWithRelations = {
  id: string
  driverProfileId: string
  driverProfile: {
    user: {
        name: string
    }
  }
  sponsorId: string
  totalPoints: number
  status: string
  createdAt: Date
  updatedAt: Date
  items: {
    id: string
    title: string
    quantity: number
  }[]
}

export default function OrderCard({ order }: { order: OrderWithRelations }) {
    return (
        <div className="border rounded-lg p-6 shadow-md bg-white mb-4">
        {/* Header with driver name and status */}
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{order.driverProfile.user.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
            }`}>
            {order.status}
            </span>
        </div>

        {/* Items list */}
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

        {/* Total */}
        <div className="border-t pt-4 flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="text-lg font-bold text-blue-600">
            {order.totalPoints} points
            </span>
        </div>

        {/* Order date */}
        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
            Ordered: {new Date(order.createdAt).toLocaleDateString()}
            <CancelOrderButton orderId = {order.id} />
        </div>
        </div>
  )
}