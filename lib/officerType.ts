import { OfficerType } from "@prisma/client";


export function officerTypeText(
  type: OfficerType
){

  switch(type){


    case "CIVIL_SERVANT":

      return "ข้าราชการ";


    case "GOVERNMENT_EMPLOYEE":

      return "พนักงานราชการ";


    case "PERMANENT_EMPLOYEE":

      return "ลูกจ้างประจำ";


    case "OUTSOURCE":

      return "จ้างเหมาบริการ";


    default:

      return "-";

  }

}