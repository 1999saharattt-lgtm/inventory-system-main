"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AppSearchInput from "@/components/AppSearchInput";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  initialValue: string;
  resultCount: number;
  pathname: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AssetCategorySearch({
  initialValue,
  resultCount,
  pathname,
}: Props) {
  const router =
    useRouter();

  const [
    search,
    setSearch,
  ] = useState(
    initialValue
  );

  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearch() {
    const keyword =
      search.trim();

    if (!keyword) {
      router.push(
        pathname
      );

      return;
    }

    router.push(
      `${pathname}?q=${encodeURIComponent(
        keyword
      )}`
    );
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function handleClear() {
    setSearch("");

    router.push(
      pathname
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
        handleSearch
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