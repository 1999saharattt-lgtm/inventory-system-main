
"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import AppSearchInput from "@/components/AppSearchInput";

/* =========================================================
   TYPES
========================================================= */

type AssetCategorySearchProps = {
  initialValue?: string;
  resultCount: number;
  pathname: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AssetCategorySearch({
  initialValue = "",
  resultCount,
  pathname,
}: AssetCategorySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [
    search,
    setSearch,
  ] = useState(initialValue);

  /* =======================================================
     URL
     รักษาปีงบประมาณที่เลือกไว้
  ======================================================= */

  function buildSearchUrl(keyword: string) {
    const params = new URLSearchParams();

    const fiscalYear =
      searchParams.get("fiscalYear");

    if (fiscalYear) {
      params.set(
        "fiscalYear",
        fiscalYear
      );
    }

    if (keyword) {
      params.set(
        "q",
        keyword
      );
    }

    const queryString = params.toString();

    return queryString
      ? `${pathname}?${queryString}`
      : pathname;
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSubmit(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const keyword =
      search.trim();

    router.push(
      buildSearchUrl(keyword)
    );
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function handleClear() {
    setSearch("");

    router.push(
      buildSearchUrl("")
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppSearchInput
      value={search}
      onChange={(event) =>
        setSearch(
          event.target.value
        )
      }
      onSubmit={
        handleSubmit
      }
      onClear={
        handleClear
      }
      placeholder="ค้นหารายการ / รหัส GFMIS / รหัสครุภัณฑ์ / ผู้รับผิดชอบ"
      resultCount={
        resultCount
      }
      resultLabel="รายการ"
      showSearchButton
      showClearButton
      searchButtonText="ค้นหา"
      clearButtonText="ล้าง"
    />
  );
}
