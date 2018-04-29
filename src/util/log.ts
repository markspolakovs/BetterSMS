
export function log(...msgs: any[]) {
    let loggingEnabled = true;
    
    console.log(msgs.map(x => x ? x.toString() : x).join(" "));
}
