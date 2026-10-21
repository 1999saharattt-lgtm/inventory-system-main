import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, AssetCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
type Row = {department:string;sourceFile:string;excelRow:number;sourceOrder:number;gf:string;assetNo:string;location:string;responsible:string;categoryText:string;name:string;brandModel:string;unit:string;quantity:number};
const apply = process.argv.includes("--apply");
const rows:Row[] = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),"assets_sheet1.json"),"utf8"));
const clean = (s:string) => (s||"").trim().replace(/\s+/g," ");
function category(r:Row):AssetCategory {
 const s=clean(r.categoryText+" "+r.name).toLowerCase();
 if(s.includes("เก้าอี้"))return AssetCategory.CHAIR;
 if(s.includes("โต๊ะ"))return AssetCategory.DESK;
 if(s.includes("เครื่องปรับอากาศ")||s.includes("แอร์"))return AssetCategory.AIR_CONDITIONER;
 if(s.includes("โทรศัพท์"))return AssetCategory.TELEPHONE;
 if(s.includes("ตู้"))return AssetCategory.CABINET;
 if(s.includes("เครื่องพิมพ์")||s.includes("printer"))return AssetCategory.PRINTER;
 if(s.includes("จอภาพ")||s.includes("monitor"))return AssetCategory.MONITOR;
 if(s.includes("ชั้นวาง")||s.includes("ชั้นหนังสือ"))return AssetCategory.SHELF;
 if(s.includes("คอมพิวเตอร์")||s.includes("notebook")||s.includes("โน้ตบุ๊ก"))return AssetCategory.COMPUTER;
 return AssetCategory.OTHER;
}
async function main(){
 if(!process.env.DATABASE_URL)throw Error("Missing DATABASE_URL");
 // Resolve actual Department names without creating or modifying departments.
 // Historical seed files may use either spelling for the network group,
 // and the population workbook may be named differently from the DB department.
 const depts=await prisma.department.findMany({select:{id:true,name:true}});
 const normalize=(s:string)=>clean(s).replace(/\s+/g,"");
 const aliases:Record<string,string[]>={
  "กลุ่มประชากร":["กลุ่มพัฒนาประชากร"],
  "กลุ่มพัฒนาประชากร":["กลุ่มประชากร"],
  "กลุ่มพัฒนาเครือข่ายอนามัยการเจริญพันธุ์":["กลุ่มพัฒนาเครือข่ายอนามัยการเจริพันธุ์"],
  "กลุ่มพัฒนาเครือข่ายอนามัยการเจริพันธุ์":["กลุ่มพัฒนาเครือข่ายอนามัยการเจริญพันธุ์"]
 };
 const depMap=new Map<string,number>();
 const missing:string[]=[];
 for(const name of [...new Set(rows.map(r=>r.department))]){
  const candidates=[name,...(aliases[name]||[])];
  const matches=depts.filter(d=>candidates.some(n=>normalize(n)===normalize(d.name)));
  if(matches.length===0){missing.push(name);continue;}
  if(matches.length>1)throw Error(`ชื่อหน่วยงาน '${name}' ตรงกับหลาย Department: ${matches.map(d=>`${d.id}:${d.name}`).join(", ")} กรุณาตรวจสอบก่อนนำเข้า`);
  depMap.set(name,matches[0].id);
  console.log(`Department: ${name} -> [${matches[0].id}] ${matches[0].name}`);
 }
 if(missing.length)throw Error("ไม่พบหน่วยงานในฐานข้อมูล: "+missing.join(", ")+"\nหน่วยงานที่มีอยู่: "+depts.map(d=>`[${d.id}] ${d.name}`).join(" | "));
 const sections=await prisma.section.findMany({where:{departmentId:{in:depts.map(d=>d.id)}},select:{id:true,name:true,departmentId:true}});
 const officers=await prisma.officer.findMany({where:{departmentId:{in:depts.map(d=>d.id)}},select:{id:true,firstName:true,lastName:true,departmentId:true,sectionId:true}});
 const existing=await prisma.asset.findMany({select:{id:true,departmentId:true,governmentAssetNo:true,officeAssetNo:true,remark:true}});
 const gfMap=new Map<string,number[]>(), officeMap=new Map<string,number[]>();
 for(const a of existing){for(const [map,val] of [[gfMap,a.governmentAssetNo],[officeMap,a.officeAssetNo]] as const){if(clean(val||"")){const key=clean(val||"");map.set(key,[...(map.get(key)||[]),a.id]);}}}
 const seenGF=new Set<string>(),seenOffice=new Set<string>();
 const report={mode:apply?"APPLY":"DRY RUN",total:rows.length,created:0,duplicates:0,ambiguous:0,errors:[] as string[],warnings:[] as string[]};
 for(const r of rows){
  const depId=depMap.get(r.department)!;const gf=clean(r.gf),office=clean(r.assetNo);
  const source=`SOURCE:FOUR_GROUPS:${r.sourceFile}:${r.excelRow}`;
  if(existing.some(a=>a.remark?.includes(source))){report.duplicates++;continue;}
  const dup=[...(gf?gfMap.get(gf)||[]:[]),...(office?officeMap.get(office)||[]:[])];
  if((gf&&seenGF.has(gf))||(office&&seenOffice.has(office))||dup.length){report.duplicates++;report.warnings.push(`${r.sourceFile} แถว ${r.excelRow}: รหัสซ้ำ ${gf} / ${office} (existing IDs ${dup.join(',')})`);continue;}
  if(gf)seenGF.add(gf);if(office)seenOffice.add(office);
  const section=sections.find(s=>s.departmentId===depId&&clean(s.name)===clean(r.location));
  const responsible=clean(r.responsible);
  const matching=officers.filter(o=>o.departmentId===depId&&clean(o.firstName+" "+o.lastName)===responsible&&(!section||o.sectionId===section.id));
  if(responsible&&!matching.length)report.warnings.push(`${r.sourceFile} แถว ${r.excelRow}: ไม่พบ Officer ตรงชื่อ '${responsible}' (เก็บเป็น responsibleName)`);
  if(!section&&r.location)report.warnings.push(`${r.sourceFile} แถว ${r.excelRow}: ไม่พบ Section ชื่อ '${r.location}' (เก็บเป็น location)`);
  if(matching.length>1){report.ambiguous++;report.warnings.push(`${r.sourceFile} แถว ${r.excelRow}: Officer ชื่อซ้ำ ไม่ผูก officerId`);}
  if(apply){
   try{await prisma.asset.create({data:{departmentId:depId,sectionId:section?.id??null,officerId:matching.length===1?matching[0].id:null,governmentAssetNo:gf||null,officeAssetNo:office||null,location:clean(r.location)||null,responsibleName:responsible||null,category:category(r),name:clean(r.name)||clean(r.categoryText)||"ครุภัณฑ์ไม่ระบุชื่อ",brand:clean(r.brandModel)||null,quantity:r.quantity,unit:clean(r.unit)||null,remark:`${source} | ORDER:${r.sourceOrder} | CATEGORY:${clean(r.categoryText)}`}});report.created++;}
   catch(e){report.errors.push(`${r.sourceFile} แถว ${r.excelRow}: ${String(e)}`);}
  }else report.created++;
 }
 console.log(JSON.stringify({...report,createdLabel:apply?"created":"wouldCreate",warnings:report.warnings.slice(0,50)},null,2));
 if(report.warnings.length>50)console.log(`Additional warnings: ${report.warnings.length-50}`);
 if(!apply)console.log("ตรวจสอบผลแล้วค่อยเรียกด้วย --apply เพื่อบันทึกจริง");
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
