import UseLoading from "@/hooks/use-loading";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shadcnui/components/ui/dialog";
import { useToast } from "@/shadcnui/components/ui/use-toast";
import { Button } from "@/ui/components/button/button";
import { Container } from "@/ui/components/container/container";
import { Typography } from "@/ui/components/typography/typography";
import clsx from "clsx";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  cardNumber: number;
  disabled: boolean;
  customerid: string;
  extensionid: string;
}

export const CloseCard = ({
  id,
  cardNumber,
  disabled,
  customerid,
  extensionid,
}: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, startLoading, stopLoading] = UseLoading();

  async function closeCard() {
    startLoading();
    const closeCard = await fetch(`/api/card/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updateType: "Status",
        cardnumber: cardNumber + 1,
        customerid: customerid,
        extensionid: extensionid,
      }),
    });

    if (closeCard.status === 200) {
      toast({
        title: "Cloturé",
        description: (
          <Typography variant="body-sm">
            La carte a été cloturée avec succès
          </Typography>
        ),
      });
      router.refresh();
      stopLoading();
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (
          <Typography variant="body-sm">
            Une erreur est survenue durant le processus de cloture. Veuillez
            récommencer.
          </Typography>
        ),
      });
      router.refresh();
      stopLoading();
    }
    stopLoading();
  }

  return (
    <Dialog>
      <DialogTrigger
        disabled={disabled}
        className={clsx(
          "text-body-base p-2 cursor-pointer animate flex flex-row items-center text-white rounded-lg animate",
          disabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600"
        )}
      >
        Cloturer la carte
      </DialogTrigger>
      <DialogContent>
        {disabled ? (
          <DialogHeader className="flex flex-col gap-4">
            <DialogTitle>
              <Typography variant="title-lg">
                Cloture de la carte {cardNumber}
              </Typography>
            </DialogTitle>
            <DialogDescription className="h-full w-full gap-4 flex flex-row">
              <Container>
                <Typography variant="title-lg">
                  Carte {cardNumber} cloturé avec succès
                </Typography>
              </Container>
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className="flex flex-col gap-4">
            <DialogTitle>
              <Typography variant="title-lg">
                Cloture de la carte {cardNumber}
              </Typography>
            </DialogTitle>
            <DialogDescription className="h-full w-full gap-4 flex flex-row">
              <Container>
                <Typography variant="title-sm">
                  Voulez-vous vraiment cloturer cette carte ?
                </Typography>
              </Container>
              <Container>
                <Button
                  buttonType="action"
                  disabled={disabled}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  isLoading={isLoading}
                  action={closeCard}
                >
                  Cloturer la carte
                </Button>
              </Container>
            </DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
};
