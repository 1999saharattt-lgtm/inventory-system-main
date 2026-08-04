import { prisma } from "@/lib/prisma";


type DocumentType = "RECEIVE" | "ISSUE";


export async function generateDocumentNo(
  type: DocumentType
) {


  const year =
    new Date().getFullYear() + 543;


  const shortYear =
    String(year).slice(-2);



  const prefix =
    type === "RECEIVE"
      ? "ร."
      : "จ.";



  let last:
    {
      documentNo: string;
    }
    | null;



  if (type === "RECEIVE") {


    last =
      await prisma.receive.findFirst({

        orderBy: {

          id: "desc",

        },

      });


  } else {


    last =
      await prisma.issue.findFirst({

        orderBy: {

          id: "desc",

        },

      });


  }




  let next = 1;



  if (last?.documentNo) {


    const regex =
      new RegExp(
        `${prefix}(\\d+)\\/(\\d+)`
      );



    const match =
      last.documentNo.match(regex);



    if (match) {


      const lastYear =
        match[2];


      const lastNumber =
        Number(match[1]);



      if (lastYear === shortYear) {


        next =
          lastNumber + 1;


      }


    }


  }





  return (
    `${prefix}` +
    `${String(next).padStart(2, "0")}` +
    `/${shortYear}`
  );


}