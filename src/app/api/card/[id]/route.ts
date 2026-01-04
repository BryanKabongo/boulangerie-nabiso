import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params: { id } }: { params: { id: string } }
) {
  const { updateType, cardnumber, customerid, extensionid } = await req.json();

  if (updateType === "Status") {
    // Utiliser une transaction pour clôturer la carte actuelle et créer la suivante
    await prisma.$transaction(async (tx) => {
      // Clôturer la carte actuelle
      await tx.card.update({
        where: {
          id: id,
        },
        data: {
          cardStatus: "CLOSED",
        },
      });

      // Créer la nouvelle carte
      await tx.card.create({
        data: {
          cardNumber: cardnumber,
          customerId: customerid,
          extensionId: extensionid,
        },
      });
    });
  } else {
    await prisma?.card.update({
      where: {
        id: id,
      },
      data: {
        paymentStatus: "PAID",
      },
    });
  }

  return NextResponse.json({ status: 200 });
}
