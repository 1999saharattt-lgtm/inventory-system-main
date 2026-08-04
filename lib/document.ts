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



  const model =
    type === "RECEIVE"
      ? prisma.receive
      : prisma.issue;



  const last =
    await model.findFirst({
      orderBy:{
        id:"desc",
      },
    });



  let next = 1;



  if(last?.documentNo){


    const regex =
      new RegExp(
        `${prefix}(\\d+)\\/(\\d+)`
      );


    const match =
      last.documentNo.match(regex);



    if(match){


      const lastYear =
        match[2];


      const lastNumber =
        Number(match[1]);



      if(lastYear === shortYear){

        next =
          lastNumber + 1;

      }


    }


  }




  return (
    `${prefix}` +
    `${String(next).padStart(2,"0")}` +
    `/${shortYear}`
  );


}