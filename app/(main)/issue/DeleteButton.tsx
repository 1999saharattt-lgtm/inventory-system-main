"use client";

import { deleteIssue } from "./action";


type Props = {
  id:number;
};


export default function DeleteButton({
  id,
}:Props){


  async function handleDelete(){


    const confirmDelete =
      confirm(
        "ต้องการลบใบเบิกนี้หรือไม่?"
      );



    if(!confirmDelete){

      return;

    }



    await deleteIssue(id);


  }





  return (

    <button

      onClick={handleDelete}

      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"

    >

      ลบ

    </button>

  );

}