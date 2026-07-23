import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({

  className = "",

  ...props

}: Props) {

  return (

    <input

      {...props}

      className={`

        w-full

        rounded-lg

        border

        border-gray-300

        px-3

        py-2

        focus:outline-none

        focus:ring-2

        focus:ring-blue-500

        focus:border-blue-500

        ${className}

      `}

    />

  );

}