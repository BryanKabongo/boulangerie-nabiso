import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { groupAndAggregateByYear } from "@/lib/group-and-aggregate-by-year";
import { AnnualChart } from "@/ui/modules/annual-chart/annual-chart";
import { calculateGlobalCardMetrics } from "@/lib/calculate-global-card-metrics";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  const user = await prisma?.user.findMany({
    where: {
      name: session?.user?.name!,
      extensionId: session?.user.extensionId!,
    },
    select: {
      id: true,
      extensionId: true,
      role: true,
    },
  });

  if (user[0].role === "USER") {
    redirect("/Deliveries");
  }

  const ordersData = await prisma?.orders.findMany({
    where: { user: { extensionId: session?.user.extensionId! } },
    select: {
      id: true,
      amount: true,
      amountPaid: true,
      amountToBeDelivered: true,
      voucher: true,
      voucherPaid: true,
      dateOrdered: true,
      type: true,
      name: true,
      CustomerId: true,
      deliveries: {
        select: {
          id: true,
          amountDelivered: true,
          dateDelivered: true,
        },
      },
      card: {
        select: {
          id: true,
        },
      },
      customer: {
        select: {
          id: true,
          customerNumber: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      dateOrdered: "desc",
    },
  });

  const cards = await prisma?.card.findMany({
    where: { extensionId: session?.user.extensionId! },
    select: {
      id: true,
      cardStatus: true,
      paymentStatus: true,
      cardNumber: true,
      customerId: true,
      extensionId: true,
      dateCreated: true,
      orders: {
        select: {
          id: true,
          amount: true,
          amountPaid: true,
          voucher: true,
          voucherPaid: true,
          dateOrdered: true,
        },
        orderBy: {
          dateOrdered: "desc",
        },
      },
    },
    orderBy: {
      cardNumber: "desc",
    },
  });

  const orders = ordersData.map((order) => ({
    id: order.id,
    amount: order.amount,
    amountPaid: order.amountPaid,
    amountToBeDelivered: order.amountToBeDelivered,
    voucher: order.voucher,
    CustomerId: order.CustomerId,
    voucherPaid: order.voucherPaid,
    dateOrdered: order.dateOrdered,
    type: order.type,
    name: order.name || "",
    typeLabel:
      order.type === "ORDER"
        ? "Commande"
        : order.type === "CASH_SALE"
        ? "Vente cash"
        : order.type === "CHARGE"
        ? "Charge"
        : order.type === "DONATION"
        ? "Don"
        : order.type === "DAMAGE"
        ? "Foutu"
        : "Brulé",
    deliveries: order.deliveries,
    arraydeliveries: order.deliveries,
    totaldelivered: order.deliveries.reduce(
      (acc, delivery) => acc + (delivery.amountDelivered || 0),
      0
    ),
    cardId: order.card ? order.card.id : null,
    cardNumber: order.customer ? order.customer.customerNumber : null,
    customerId: order.customer ? order.customer.id : null,
    userId: order.user.id,
    userName: order.user.name,
    isDate: false,
  }));

  const dataGroupByYearAndMonth = groupAndAggregateByYear(orders);
  const cardsMetric = calculateGlobalCardMetrics(cards);

  return (
    <main>
      <AnnualChart data={dataGroupByYearAndMonth} cards={cardsMetric} />
    </main>
  );
}
