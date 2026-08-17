const body = pageRows.map((r: any) => {
  return [
    formatDate(r.date),

    r.documentNo || "-",

    r.owner || "-",

    formatMoney(r.unitPrice),

    // รับเข้า
    r.receiveQty === 0 ||
    r.receiveQty === null ||
    r.receiveQty === undefined ||
    r.receiveQty === ""
      ? "-"
      : r.receiveQty,

    // เบิกจ่าย
    r.issueQty === 0 ||
    r.issueQty === null ||
    r.issueQty === undefined ||
    r.issueQty === ""
      ? "-"
      : r.issueQty,

    // คงเหลือ
    r.balance === null ||
    r.balance === undefined ||
    r.balance === ""
      ? "-"
      : r.balance,

    formatDate(r.manufacture),

    formatDate(r.expiry),
  ];
});