"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireDriver } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function getCartItemCount() {
  const user = await getCurrentUser();

  if (!user?.driverProfile) {
    return 0;
  }

  const cart = await prisma.cart.findUnique({
    where: { driverProfileId: user.driverProfile.id },
    include: {
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  if (!cart) {
    return 0;
  }

  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function addToCart(catalogProductId: string) {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  // Get the catalog product
  const catalogProduct = await prisma.catalogProduct.findUnique({
    where: { id: catalogProductId },
    include: { sponsor: true },
  });

  if (!catalogProduct) {
    throw new Error("Product not found");
  }

  // Verify driver belongs to this sponsor
  if (catalogProduct.sponsorId !== driverProfile.sponsorId) {
    throw new Error("This product is not available to you");
  }

  if (!catalogProduct.isActive) {
    throw new Error("This product is no longer available");
  }

  // Calculate point price
  const pointPrice = Math.ceil(catalogProduct.price / catalogProduct.sponsor.pointValue);

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { driverProfileId: driverProfile.id },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        driverProfileId: driverProfile.id,
      },
    });
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      ebayItemId: catalogProduct.ebayItemId,
    },
  });

  if (existingItem) {
    // Increment quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + 1,
      },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        ebayItemId: catalogProduct.ebayItemId,
        title: catalogProduct.title,
        imageUrl: catalogProduct.imageUrl,
        pointPrice: pointPrice,
        quantity: 1,
      },
    });
  }

  revalidatePath("/driver/catalog");
  revalidatePath("/driver/cart");

  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  // Verify ownership
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
    },
  });

  if (!cartItem || cartItem.cart.driverProfileId !== driverProfile.id) {
    throw new Error("Cart item not found");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be at least 1");
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  revalidatePath("/driver/cart");

  return { success: true };
}

export async function removeFromCart(cartItemId: string) {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  // Verify ownership
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
    },
  });

  if (!cartItem || cartItem.cart.driverProfileId !== driverProfile.id) {
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  revalidatePath("/driver/cart");

  return { success: true };
}

export async function clearCart() {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  const cart = await prisma.cart.findUnique({
    where: { driverProfileId: driverProfile.id },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  revalidatePath("/driver/cart");

  return { success: true };
}