/// <reference path="./underscore.d.ts" />
/// <reference path="./es6-promise.d.ts" />

class Signal<T> {
    private handlers:{ (value?:T): void; }[] = [];

    add(handler:(value?:T) => void) {
        this.handlers.push(handler);
        return handler;
    }

    remove(handler:(value?:T) => void) {
        this.handlers = _.without(this.handlers, handler);
    }

    dispatch(value?:T) {
        this.handlers.forEach((handler) => {
            handler(value)
        });
    }
}

interface Encoding {
    decode(values:number[]):string;
    encode(data:string):Uint8Array;
}

declare class TextDecoder {
    constructor(name:string);
    decode(data:Uint8Array):string;
}

declare class TextEncoder {
    constructor(name:string);
    encode(data:string):Uint8Array;
}

class TextDecoderEncoding implements Encoding {
    constructor(private id:string) {
    }

    encode(data:string):Uint8Array {
        return new TextEncoder(this.id).encode(data);
    }

    decode(array:number[]) {
        return new TextDecoder(this.id).decode(new Uint8Array(array));
    }
}

class CType {
    static isPrint(value:Number) {
        if (value < 32) return false;
        return true;
    }

    static ensurePrintable(str:string) {
        //return String.fromCharCode.apply(null, str.split('').map(v => (v.charCodeAt(0) < 32) ? v : '.'));
        return str;
    }
}

class HexImage {
    constructor(public data:ArrayBuffer) {
    }

    toHtml() {
        var blob = new Blob([this.data], {type: 'application/octet-binary'}); // pass a useful mime type here
        var url = URL.createObjectURL(blob);
        return '<span class="hexrgbsample" style="background-image:url(' + url + ');"></span>';
    }
}

class HexRgb {
    constructor(public red:number, public green:number, public blue:number) {
    }

    toHtml() {
        return '<span class="hexrgbsample" style="background:rgba(' + this.red + ', ' + this.green + ', ' + this.blue + ', 1.0);"></span> RGB(' + this.red + ', ' + this.green + ', ' + this.blue + ')';
    }
}

interface NumberDictionary<T> {
    [name: number]: T;
}

interface StringDictionary<T> {
    [name: string]: T;
}

function download(url:string, done: (data: Uint8Array) => void) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
        done(new Uint8Array(this.response));
    };

    xhr.send();
}

function unsigned_mod(value: number, count:number) {
    value %= 32;
    if (value < 0) value += count;
    return value;
}

function ror32(value: number, count:number) {
    count = unsigned_mod(count, 32);
    return value >>> count | value << (32 - count);
}
function ror16(value: number, count:number) {
    count = unsigned_mod(count, 16);
    return ((value >>> count) & 0xFFFF) | ((value << (16 - count)) & 0xFFFF);
}
function ror8(value: number, count:number) {
    count = unsigned_mod(count, 8);
    return ((value >>> count) & 0xFF) | ((value << (8 - count)) & 0xFF);
}

function htmlspecialchars(s:string) {
    s = String(s);
    return s.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function waitAsync(time:number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

function strpad_left(value:string, char:string, count:number) {
    return (Array(count).join(char) + value).slice(-count);
}

function strpad_right(value:string, char:string, count:number) {
    return (value + Array(count).join(char)).slice(count);
}