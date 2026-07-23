type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "success" | "danger" | "warning";
  onClick?: () => void;
  className?: string;
};


const styles = {

  primary:
    "bg-blue-700 hover:bg-blue-800 text-white",

  success:
    "bg-green-600 hover:bg-green-700 text-white",

  danger:
    "bg-red-600 hover:bg-red-700 text-white",

  warning:
    "bg-yellow-500 hover:bg-yellow-600 text-white",

};



// ปุ่มทั่วไป

export default function Button({

  children,

  type="button",

  variant="primary",

  onClick,

  className=""

}:ButtonProps){


return (

<button

type={type}

onClick={onClick}

className={`
px-4
py-2
rounded-lg
font-semibold
shadow-sm
transition
${styles[variant]}
${className}
`}

>

{children}

</button>

);

}





// ปุ่ม Link ใช้กับ Next Link

import Link from "next/link";


type LinkButtonProps = {

href:string;

children:React.ReactNode;

variant?:
"primary" |
"success" |
"danger" |
"warning";

className?:string;

};



export function LinkButton({

href,

children,

variant="primary",

className=""

}:LinkButtonProps){


return (

<Link

href={href}

className={`
inline-flex
items-center
justify-center
px-4
py-2
rounded-lg
font-semibold
shadow-sm
transition
${styles[variant]}
${className}
`}

>

{children}

</Link>


);


}