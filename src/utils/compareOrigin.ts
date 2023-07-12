import getOrigin from "./getOrigin"

const compareOrigin = (SD1: string|Object, SD2: string|Object) => {
    const origin1 = getOrigin(SD1);
    const origin2 = getOrigin(SD2);;
    if(origin1 === undefined || origin2 === undefined) return false;
    if(origin1 === origin2) return true; 

}

export default compareOrigin;