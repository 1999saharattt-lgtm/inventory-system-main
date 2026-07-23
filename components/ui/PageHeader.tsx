type Props = {

title:string;

description?:string;

children?:React.ReactNode;

};


export default function PageHeader({

title,

description,

children

}:Props){


return (

<div className="
flex
justify-between
items-center
mb-6
">


<div>


<h1 className="
text-3xl
font-bold
text-gray-800
">

{title}

</h1>


{
description &&

<p className="
text-gray-500
mt-1
">

{description}

</p>

}


</div>


<div>

{children}

</div>


</div>

);


}