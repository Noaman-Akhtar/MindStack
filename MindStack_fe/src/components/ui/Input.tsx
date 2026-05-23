interface InputProps{
    type: "text" | "password" | "email";
    variant:"primary"|"secondary";
    onChange?:(e:React.ChangeEvent<HTMLInputElement>)=> void ;
    placeholder:string;
    ref?:any;
    height?:string;
}
const variantStyles={
    "primary":"bg-gray-100",
    "secondary":"bg-[#131318]  text-white placeholder:text-gray-400 "
}
export function Input(props: InputProps) {
    return (
        <div>
            <input 
            ref={props.ref}
                placeholder={props.placeholder} 
                type={props.type} 
                onChange={props.onChange}
                className={"w-full tracking-wider outline-none border-[1.3px] border-gray-300 focus:border-voilet-900/60 rounded h-10 pl-3 py-1 text-l placeholder:italic transition-colors duration-200"+" "+variantStyles[props.variant]}
style={props.height?{height:props.height}:undefined}
            />
        </div>
 )};