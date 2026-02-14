export interface EbayProduct {
  itemId: string;
  title: string;
  price: number;
  imageUrl: string;
}

export async function searchEbayProducts(
  query: string,
): Promise<EbayProduct[]> {
  const appId = process.env.EBAY_APP_ID;

  // Use SANDBOX API
  const url = `https://svcs.sandbox.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${appId}&RESPONSE-DATA-FORMAT=JSON&keywords=${query}&paginationInput.entriesPerPage=20`;

  const response = await fetch(url);
  const data = await response.json();

  //console.log("eBay Response:", JSON.stringify(data, null, 2));
  //This console log is for testing

  if (data.errorMessage) {
    const errorDetail = data.errorMessage[0].error[0];
    console.error("eBay Error Details:", errorDetail);
    throw new Error(
      `eBay Error: ${errorDetail.message[0]} (Code: ${errorDetail.errorId[0]})`,
    );
  }

  const items = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item;

  if (!items) {
    return [];
  }

  return items.map((item: any) => ({
    itemId: item.itemId[0],
    title: item.title[0],
    price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__),
    imageUrl: item.galleryURL?.[0] || "",
  }));
}

export function convertToPoints(usdPrice: number, pointValue: number): number {
  return Math.ceil(usdPrice / pointValue);
}
