import { Container } from "@/ui/components/container/container";
import { Typography } from "@/ui/components/typography/typography";
import prisma from "@/lib/prisma";
import { CardView } from "./card-view";
import { auth } from "@/auth";

export default async function Home({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const customer = await prisma.customer.findUnique({
    where: {
      id,
    },
    include: {
      card: {
        select: {
          id: true,
          cardStatus: true,
          paymentStatus: true,
          cardNumber: true,
          customerId: true,
          extensionId: true,
          orders: {
            select: {
              id: true,
              cardId: true,
              amount: true,
              amountPaid: true,
              voucher: true,
              voucherPaid: true,
              dateOrdered: true,
              userId: true,
              CustomerId: true,
              name: true,
              amountToBeDelivered: true,
              type: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              dateOrdered: "desc",
            },
          },
        },
        orderBy: {
          cardNumber: "desc",
        },
      },
    },
  });

  const extension = await prisma.extension.findUnique({
    where: {
      id: customer?.extensionId,
    },
    select: {
      rate: true,
    },
  });

  const session = await auth();

  const userData = await prisma.user.findMany({
    where: {
      id: session!.user!.id,
      extensionId: session?.user.extensionId,
    },
    select: {
      id: true,
      extensionId: true,
      extension: true,
      role: true,
    },
  });
  console.log(customer?.card!);

  return (
    <main className="w-full flex flex-col">
      <Container className="w-full flex flex-col gap-8 rounded">
        <Container className="flex flex-row gap-4 items-center">
          <Typography variant="title-lg">{customer?.name}</Typography>
          <Typography className="text-neutral-500">
            (Taux de commission : {extension?.rate || 27 / 100}%)
          </Typography>
        </Container>
        <CardView
          card={customer?.card!}
          rate={extension?.rate || 27}
          userData={userData[0]}
        />
      </Container>
    </main>
  );
}
