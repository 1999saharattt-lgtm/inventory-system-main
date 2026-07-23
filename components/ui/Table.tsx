type Props = {
children:React.ReactNode;
};


export default function Table({
children
}:Props){


return (

<div

className="
overflow-hidden
rounded-xl
border
border-gray-200
bg-white
shadow-sm
"


>

<table

className="
w-full
text-sm
"

>

{children}

</table>


</div>

);


}