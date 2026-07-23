import { ReactNode } from "react";

type Props = {

  children: ReactNode;

};

export default function Badge({

  children,

}: Props) {

  return (

    <span

      className="

      inline-flex

      px-2

      py-1

      rounded-full

      text-sm

      bg-blue-100

      text-blue-700

    "

    >

      {children}

    </span>

  );

}