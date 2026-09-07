"use client";

import React, { useRef, useState } from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Department = {
  id: number;
  name: string;
};

type Asset = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  governmentAssetNo: string | null;
  officeAssetNo: string | null;
  departmentId: number;
  sectionId: number | null;
  officerId: number | null;
  status: string;
  purchaseDate: Date | string | null;
  price: number | null;
  location: string | null;
  remark: string | null;
  section: {
    id: number;
    name: string;
  } | null;
  officer: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
  } | null;
};

type Officer = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  type: string;
  departmentId: number | null;
  sectionId: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  section: {
    id: number;
    name: string;
  } | null;
};

type InspectionRow = {
  assetId: number;
  countedQty: string;
  accuracy: string;
  status: string;
  remark: string;
};

type Props = {
  department: Department;
  assets: Asset[];
  rows: InspectionRow[];
  inspectionStartDate: string;
  inspectionEndDate: string;
  inspectorIds: string[];
  officers: Officer[];
};

const ROWS_PER_PAGE = 12;

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/* =========================================================
   วันที่
========================================================= */

function parseDateOnly(value: string) {
  if (!value) {
    return new Date(NaN);
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatThaiDate(value: string) {
  if (!value) {
    return "........";
  }

  const date = parseDateOnly(value);

  if (Number.isNaN(date.getTime())) {
    return "........";
  }

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

function getFiscalYear(value: string) {
  if (!value) {
    return "........";
  }

  const date = parseDateOnly(value);

  if (Number.isNa