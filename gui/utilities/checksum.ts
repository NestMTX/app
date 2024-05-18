function crc32(str: string): number {
    let crc = 0 ^ (-1);
  
    for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);
      crc = (crc >>> 8) ^ crcTable[(crc ^ charCode) & 0xff];
    }
  
    return (crc ^ (-1)) >>> 0;
  }
  
// Precompute a table for CRC32 calculation
const crcTable = (function () {
let c;
const table = [];
for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
}
return table;
})();

export const checksum = (input: any): string => {
    return crc32(JSON.stringify(input)).toString(16);
}