declare module "save-file/browser" {
  type DataType =
    | Buffer
    | ArrayBuffer
    | string
    | Array<any>
    | Uint16Array
    | Uint32Array
    | Uint8Array
    | Float32Array
    | Float64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Object;
  function save(data: DataType | string, filename: string): Promise<void>;

  export = save;
}
