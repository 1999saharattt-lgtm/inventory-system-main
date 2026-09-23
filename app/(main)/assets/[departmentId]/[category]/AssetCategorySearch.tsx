"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
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

  const [
    search,
    setSearch,
  ] = useState(initialValue);

  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSubmit(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const keyword =
      search.trim();

    if (!keyword) {
      router.push(pathname);
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

    router.push(pathname);
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