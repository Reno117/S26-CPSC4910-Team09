import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import OrderCard from "@/app/components/orders/OrderCard";

export default async function ViewOrders(){
    const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

    const orders = await prisma.order.findMany({
        where: isAdmin
        ? {}
        : {sponsorId: sponsorId!},
        include:{
            driverProfile:{
                include: {
                    user: true,
                }
            },
            sponsor: true,
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        }
    })

    const drivers = await prisma.order.findMany()
    return (
        <div>
          <SponsorHeader />
             <div className="container mx-auto p-4 pt-20">
            {orders.map(order => (
                <OrderCard key={order.id} order={order} />
            ))}
            </div>
          </div>
    )
}