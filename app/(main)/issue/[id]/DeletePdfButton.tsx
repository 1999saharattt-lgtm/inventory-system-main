"use client";

import { deleteIssuePdf } from "../action";


type Props = {
  id:number;
};


export default function DeletePdfButton({
  id,
}:Props){


  async function handleDelete(){

    const confirmDelete =
      confirm(
        "ต้องการลบไฟล์ PDF ใบเบิกนี้หรือไม่?"
      );


    if(!confirmDelete){
      return;
    }


    await deleteIssuePdf(id);


  }



  return (

    <button

      onClick={handleDelete}

      className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"

    >

      ลบไฟล์ PDF

    </button>

  );

}