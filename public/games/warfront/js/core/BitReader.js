/** * BitReader & BitWriter Binary Stream Decoder * WarFront.io System Module */ export const SystemModule_BitReader = {
  8263:(A, t, e)=> {
    "use strict";
    e.d(t, {
      C:()=>r
    }
    );
    class r {
      constructor(A) {
        this.offset=0, this.buffer=A
      }
      readBits(A) {
        if (A>32)throw new Error("Cannot read more than 32 bits at a time");
        if (this.offset+A>8*this.buffer.length)throw new Error("Not enough data to read");
        let t=0;
        for (let e=this.offset;
        e<this.offset+A;
        e++)t|=(this.buffer[e>>>3]>>>(7&~e)&1)<<e-this.offset;
        return this.offset+=A, t>>>0
      }
      readString(A) {
        const t=Math.min(A, this.readBits(16));
        let e="";
        for (let A=0;
        A<t;
        A++)e+=String.fromCharCode(this.readBits(8));
        return e
      }
      readBoolean() {
        return 1===this.readBits(1)
      }
    }
  }
}
;