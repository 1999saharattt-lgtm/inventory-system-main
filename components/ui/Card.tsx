type Props = {
  children: React.ReactNode;
  className?: string;
};


export default function Card({
  children,
  className=""
}:Props){


return (

<div

className={`
bg-white
rounded-xl
border
border-gray-200
shadow-sm
p-6
${className}
`}

>

{children}

</div>

);


}