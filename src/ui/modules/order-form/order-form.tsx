/* eslint-disable react/no-unescaped-entities */
"use client";

import { useToast } from "@/shadcnui/components/ui/use-toast";
import { OrdersFormFieldsType } from "@/types/forms";
import { Container } from "@/ui/components/container/container";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import UseLoading from "@/hooks/use-loading";
import { useEffect, useState } from "react";
import { Typography } from "@/ui/components/typography/typography";
import { InputField } from "@/ui/components/input-field/input-field";
import { Form } from "@/shadcnui/components/ui/form";
import { Button } from "@/ui/components/button/button";
import { Options } from "@/types/options";
import { InputFieldCombobox } from "@/ui/components/input-field-combobox/input-field-combobox";
import { InputFieldRadio } from "@/ui/components/input-field-radio/input-field-radio";
import { OrderTypes } from "@/lib/order-types/order-types";
import { InputFieldDate } from "@/ui/components/input-field-date/input-field-date";
import useStore from "@/hooks/useStore";
import useExtensionIdStore from "@/store/extension-id-store";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  customers: Options[];
  users: {
    id: string;
    extensionId: string;
    role: "USER" | "ADMIN";
  }[];
}

export const OrderForm = ({ customers, users }: Props) => {
  const extensionId = useStore(
    useExtensionIdStore,
    (state) => state.extensionId
  );
  const currentUser = extensionId
    ? users.find((user) => user.extensionId === extensionId)
    : null;
  const { toast } = useToast();
  const router = useRouter();
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [isLoading, startLoading, stopLoading] = UseLoading();
  const [isReady, setIsReady] = useState(false);
  const form = useForm<z.infer<typeof OrdersFormFieldsType>>({
    resolver: zodResolver(OrdersFormFieldsType),
    defaultValues: {
      amount: 0,
      amountpaid: 0,
      voucher: 0,
      voucherpaid: 0,
      dateordered: undefined,
      customerid: "",
      name: "",
      type: "ORDER",
      amountdelivered: 0,
    },
  });

  const type = useWatch({
    control: form.control,
    name: "type",
    defaultValue: "ORDER",
  });

  const date = useWatch({
    control: form.control,
    name: "dateordered",
    defaultValue: new Date(),
  });

  const customerid = useWatch({
    control: form.control,
    name: "customerid",
    defaultValue: "",
  });

  const name = useWatch({
    control: form.control,
    name: "name",
    defaultValue: "",
  });

  const amountdelivered = useWatch({
    control: form.control,
    name: "amountdelivered",
    defaultValue: 0,
  });

  const amount = useWatch({
    control: form.control,
    name: "amount",
    defaultValue: 0,
  });

  const voucherpaid = useWatch({
    control: form.control,
    name: "voucherpaid",
    defaultValue: 0,
  });

  useEffect(() => {
    if (customerid !== "") {
      const currentCustomer = customers.find(
        (customer) => customer.value === customerid
      );
      setCurrentCardId(currentCustomer?.currentCard!);
    }
  }, [customerid, customers]);

  useEffect(() => {
    if (type === "ORDER") {
      if (customerid != "") {
        if (amount > 0 || voucherpaid > 0) {
          setIsReady(true);
        } else {
          setIsReady(false);
        }
      } else {
        setIsReady(false);
      }
    } else {
      if (name !== "" && amountdelivered > amount) {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    }
  }, [type, customerid, form, name, amountdelivered, amount, voucherpaid]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "amount" || name === "amountpaid") {
        form.setValue("voucher", value.amount! - value.amountpaid!);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const tokenOrder = (
    idOrder: string,
    id: any,
    amount: number,
    bp: number,
    date: string
  ) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [50, 50],
    });

    doc.setFontSize(10);
    doc.text("Boulangerie na biso", 25, 5, { align: "center" });
    doc.setFontSize(10);
    doc.text("N° " + id, 25, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("" + amount + " Fc", 25, 25, { align: "center" });
    doc.setFontSize(10);
    doc.text("BP " + bp + " Fc", 25, 35, { align: "center" });
    doc.text("" + date, 25, 45, { align: "center" });
    doc.save("Commande/" + date + "/" + idOrder + ".pdf");
  };

  const tokenOrderVC = (
    idOrder: string,
    id: any,
    amount: number,
    amountdelivered: number,
    date: string
  ) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [50, 50],
    });

    doc.setFontSize(10);
    doc.text("Boulangerie na biso", 25, 5, { align: "center" });
    doc.setFontSize(10);
    doc.text("VC " + id, 25, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("" + amount + " Fc", 25, 25, { align: "center" });
    doc.setFontSize(10);
    doc.text("L " + amountdelivered + " Fc", 25, 35, { align: "center" });
    doc.text("" + date, 25, 45, { align: "center" });
    doc.save("Commande/" + date + "/" + idOrder + ".pdf");
  };

  async function onSubmit(values: z.infer<typeof OrdersFormFieldsType>) {
    if (isLoading) return;
    startLoading();
    const {
      amount,
      amountpaid,
      voucher,
      voucherpaid,
      dateordered,
      customerid,
      name,
      type,
      amountdelivered,
    } = values;

    const addOrder = await fetch(`/api/order`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardid: currentCardId,
        amount,
        amountpaid,
        voucher,
        voucherpaid,
        dateordered,
        customerid: customerid,
        name,
        type,
        amountdelivered,
        userid: currentUser?.id,
      }),
    });

    if (addOrder.status === 200) {
      const order = await addOrder.json();
      toast({
        title: "Commande ajoutée",
        description: (
          <Typography variant="body-sm">
            La commande a été ajoutée avec succès
          </Typography>
        ),
      });
      stopLoading();
      if (type === "CASH_SALE") {
        tokenOrderVC(
          order.orderId,
          customerid
            ? customers.filter((customer) => customer.value === customerid)[0]
                .customerNumber
            : name,
          amount,
          amountdelivered,
          format(dateordered, "dd-MM-yyyy", { locale: fr })
        );
      } else {
        tokenOrder(
          order.orderId,
          customerid
            ? customers.filter((customer) => customer.value === customerid)[0]
                .customerNumber
            : name,
          amount,
          voucher,
          format(dateordered, "dd-MM-yyyy", { locale: fr })
        );
      }
      form.reset();
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Erreur !",
        description: (
          <Typography variant="body-sm">
            Une erreur s'est produite lors de l'ajout de la commande. Veuillez
            réessayer.
          </Typography>
        ),
      });
      router.refresh();
      stopLoading();
    }
    router.refresh();
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative flex flex-col gap-8"
      >
        <Container className="flex flex-row gap-8 w-full">
          <Container className="flex flex-col gap-8 basis-1/3 border p-4 rounded-lg">
            <Typography variant="title-sm">Type de la commande</Typography>
            <Container>
              <InputFieldRadio
                control={form.control}
                name={"type"}
                items={OrderTypes}
              />
            </Container>
            <Container>
              <InputFieldDate
                control={form.control}
                name={"dateordered"}
                label={"Date de la commande"}
                role={currentUser ? currentUser.role : undefined}
              />
            </Container>
          </Container>
          <Container className="flex flex-col justify-between basis-2/3 border p-4 rounded-lg gap-8">
            <Container className="flex">
              <Container className="p-2 bg-primary-100 rounded-lg">
                <Typography variant="title-lg" className="text-primary-800">
                  {type === "ORDER"
                    ? "Commande"
                    : type === "CASH_SALE"
                    ? "Vente cash"
                    : type === "CHARGE"
                    ? "Charge"
                    : type === "DONATION"
                    ? "Don"
                    : type === "DAMAGE"
                    ? "Foutu"
                    : "Brulé"}
                </Typography>
              </Container>
            </Container>
            <Container className="flex flex-col gap-8">
              <Typography variant="title-sm">Détails de la commande</Typography>
              {type === "ORDER" ? (
                <Container className="flex flex-col gap-4">
                  <Container>
                    <InputFieldCombobox
                      control={form.control}
                      name={"customerid"}
                      placeholder={"Selectionnez le client"}
                      items={customers}
                    />
                  </Container>
                  <Container className="grid grid-cols-2 gap-4">
                    <Container>
                      <InputField
                        placeholder="Montant de la commande"
                        control={form.control}
                        name="amount"
                        type={"number"}
                        label="Montant de la commande"
                      />
                    </Container>
                    <Container>
                      <InputField
                        placeholder="Montant payé"
                        control={form.control}
                        name="amountpaid"
                        type={"number"}
                        label="Montant payé"
                      />
                    </Container>
                    <Container>
                      <InputField
                        placeholder="B.P."
                        control={form.control}
                        name="voucher"
                        type={"number"}
                        label="B.P."
                        disabled
                      />
                    </Container>
                    <Container>
                      <InputField
                        placeholder="B.P.P."
                        control={form.control}
                        name="voucherpaid"
                        type={"number"}
                        label="B.P.P."
                      />
                    </Container>
                  </Container>
                </Container>
              ) : (
                <Container className="flex flex-col gap-4">
                  <Container>
                    <InputField
                      control={form.control}
                      name={"name"}
                      placeholder={"Nom du client"}
                    />
                  </Container>
                  <Container className="grid grid-cols-2 gap-4">
                    <Container>
                      <InputField
                        placeholder="Montant de la commande"
                        control={form.control}
                        name="amount"
                        type={"number"}
                        label="Montant de la commande"
                      />
                    </Container>
                    <Container>
                      <InputField
                        placeholder="Montant à livrer"
                        control={form.control}
                        name="amountdelivered"
                        type={"number"}
                        label="Montant à livrer"
                      />
                    </Container>
                  </Container>
                </Container>
              )}
            </Container>
            <Container>
              <Button
                disabled={isLoading || !isReady}
                type="submit"
                isLoading={isLoading}
              >
                Valider la commande
              </Button>
            </Container>
          </Container>
        </Container>
      </form>
    </Form>
  );
};
