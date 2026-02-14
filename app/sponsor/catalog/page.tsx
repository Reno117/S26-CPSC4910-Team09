
import { searchEbay } from "@/app/actions/sponsor/catalog/search-ebay";
import EbayProductCard from "@/app/components/catalog/ebay-product-card";
import { prisma } from "@/lib/prisma";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";

export default async function CatalogList() {
    const catalogItems = await prisma.catalogProduct.findMany({
        select:{
            ebayItemId: true,
            imageUrl: true,
            title: true
        },
        orderBy:{
            createdAt: "desc"
        },
    });
    return(
    <div>
        <SponsorHeader />
        <div>
            <div className="w-full h-130 overflow-hidden">
                <img
                src="/semitruck.jpg"
                alt="Sponsor Dashboard"
                className="w-full h-auto object-cover object-center"
                />
            </div>
        </div>
        <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-align: Center">Catalog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogItems.map((item) => (
            <div key={item.ebayItemId} className="border rounded-lg p-4 shadow-sm">
                <img 
                src={item.imageUrl || '/placeholder.png'} 
                alt={item.title}
                className="w-full h-48 object-cover rounded"
                />
                <h3 className="mt-2 font-semibold">{item.title}</h3>
            </div>
            ))}
        </div>

    </div>
    </div>
        
    )
}