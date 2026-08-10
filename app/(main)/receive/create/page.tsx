
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReceiveForm from "./ReceiveForm";



function getThaiYear() {

  return String(
    new Date().getFullYear() + 543
  ).slice(-2);

}



async function generateReceiveNo() {

  const year = getThaiYear();

  const receives =
    await prisma.receive.findMany({

      where: {

        documentNo: {

          startsWith: "ร.",

        },

      },

      select: {

        documentNo: true,

      },

    });



  let running = 1;



  for (const receive of receives) {

    const match =

      receive.documentNo.match(

        /ร\.(\d+)\/(\d+)/

      );



    if(match){

      const lastNumber =

        Number(match[1]);



      const lastYear =

        match[2];



      if(lastYear === year){

        if(lastNumber >= running){

          running = lastNumber + 1;

        }

      }

    }

  }



  return `ร.${String(running).padStart(2, "0")}/${year}`;

}



export default async function CreateReceivePage(){



  const [

    materials,

    vendors,

    documentNo,

  ] = await Promise.all([



    prisma.material.findMany({

      orderBy:[

        {

          category:"asc",

        },

        {

          code:"asc",

        },

      ],

    }),



    prisma.vendor.findMany({

      orderBy:{

        name:"asc",

      },

    }),



    generateReceiveNo(),

  ]);




}
