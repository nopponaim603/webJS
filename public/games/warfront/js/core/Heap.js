/** * Heap & Priority Queue Data Structures * WarFront.io System Module */ export const SystemModule_Heap = {
  5218:(A, t, e)=> {
    "use strict";
    e.d(t, {
      M:()=>r
    }
    );
    class r {
      constructor(A) {
        this.comparator=A, this.heap=[]
      }
      isEmpty() {
        return 0===this.size()
      }
      size() {
        return this.heap.length
      }
      peek() {
        return this.heap[0]
      }
      push(A) {
        return this.siftUp(A), this.size()
      }
      pop() {
        if (1===this.size())return this.heap.pop();
        const A=this.heap[0];
        return this.siftDown(this.heap.pop()), A
      }
      update(A, t) {
        const e=this.heap.findIndex(A);
        return -1===e||(this.heap[e]=t, this.siftUp(t, e)), this.size()
      }
      siftUp(A, t=this.size()) {
        for (;
        t>0;
        ) {
          const e=(t+1>>>1)-1;
          if (!this.comparator(A, this.heap[e]))break;
          this.heap[t]=this.heap[e], t=e
        }
        this.heap[t]=A
      }
      siftDown(A) {
        let t=0;
        const e=this.size()>>>1;
        for (;
        t<e;
        ) {
          const e=1+(t<<1), r=e+1, i=this.heap[e], s=this.heap[r];
          if (r<this.size()&&this.comparator(s, i)) {
            if (!this.comparator(s, A))break;
            this.heap[t]=s, t=r
          }
          else {
            if (!this.comparator(i, A))break;
            this.heap[t]=i, t=e
          }
        }
        this.heap[t]=A
      }
    }
  }
  , 8349:(A, t, e)=> {
    "use strict";
    e.d(t, {
      j:()=>r
    }
    );
    class r {
      constructor() {
        this.elements=[], this.values=[]
      }
      add(A, t) {
        const e=this.values.findIndex((A=>A<=t));
        -1===e?(this.elements.push(A), this.values.push(t)):(this.elements.splice(e, 0, A), this.values.splice(e, 0, t))
      }
      remove(A) {
        const t=this.elements.indexOf(A);
        -1!==t&&(this.elements.splice(t, 1), this.values.splice(t, 1))
      }
      find(A) {
        return this.elements.find(A)
      }
      forEach(A) {
        this.elements.forEach(A)
      }
      some(A) {
        return this.elements.some(A)
      }
      every(A) {
        return this.elements.every(A)
      }
      [Symbol.iterator]() {
        return this.elements[Symbol.iterator]()
      }
    }
  }
  , 3532:(A, t, e)=> {
    "use strict";
    e.d(t, {
      a:()=>r
    }
    );
    class r extends Map {
      constructor(A) {
        super(), this.defaultValue=A
      }
      getOrSet(A) {
        const t=this.get(A);
        if (t)return t;
        const e=this.defaultValue();
        return this.set(A, e), e
      }
    }
  }
  , 2902:(A, t, e)=> {
    "use strict";
    e.d(t, {
      l:()=>i
    }
    );
    class r {
      constructor(A, t, e, r=1) {
        this.r=A, this.g=t, this.b=e, this.a=r
      }
      toString() {
        return `($ {
          this.r
        }
        , $ {
          this.g
        }
        , $ {
          this.b
        }
        , $ {
          this.a
        }
        )`
      }
      writeToBuffer(A, t) {
        A[t]=this.r, A[t+1]=this.g, A[t+2]=this.b, A[t+3]=255*this.a|0
      }
      blendWithBuffer(A, t, e=1) {
        A[t]=e*this.a*this.r+(1-e*this.a)*A[t], A[t+1]=e*this.a*this.g+(1-e*this.a)*A[t+1], A[t+2]=e*this.a*this.b+(1-e*this.a)*A[t+2]
      }
      withRed(A) {
        return new r(Math.min(Math.max(A, 0, 255)), this.g, this.b, this.a)
      }
      withGreen(A) {
        return new r(this.r, Math.min(Math.max(A, 0, 255)), this.b, this.a)
      }
      withBlue(A) {
        return new r(this.r, this.g, Math.min(Math.max(A, 0, 255), this.b, this.a))
      }
      withAlpha(A) {
        return new i(this.r, this.g, this.b, Math.min(Math.max(A, 0), 1))
      }
    }
    class i {
      constructor(A, t, e, r=1) {
        this.h=A, this.s=t, this.l=e, this.a=r
      }
      toString() {
        return `hsla($ {
          this.h
        }
        , $ {
          100*this.s
        }
        %, $ {
          100*this.l
        }
        %, $ {
          this.a
        }
        )`
      }
      toRGB() {
        return new r(this.toRGBComponent(0), this.toRGBComponent(8), this.toRGBComponent(4), this.a)
      }
      withHue(A) {
        return new i((A%360+360)%360, this.s, this.l, this.a)
      }
      withSaturation(A) {
        return new i(this.h, Math.min(Math.max(A, 0), 1), this.l, this.a)
      }
      withLightness(A) {
        return new i(this.h, this.s, Math.min(Math.max(A, 0), 1), this.a)
      }
      withAlpha(A) {
        return new i(this.h, this.s, this.l, Math.min(Math.max(A, 0), 1))
      }
      static fromRGB(A, t, e) {
        A/=255, t/=255, e/=255;
        const r=Math.max(A, t, e), s=Math.min(A, t, e), a=r-s, n=1-Math.abs(s+r-1);
        let o=0;
        if (0!==a) {
          switch (r) {
            case A:o=(t-e)/a%6;
            break;
            case t:o=(e-A)/a+2;
            break;
            case e:o=(A-t)/a+4
          }
          o=60*(o<0?o+6:o)
        }
        return new i(o, 0===n?0:a/n, (r+s)/2)
      }
      toRGBComponent(A) {
        const t=(A+this.h/30)%12, e=this.s*Math.min(this.l, 1-this.l);
        return Math.round(255*(this.l-e*Math.max(-1, Math.min(t-3, 9-t, 1))))
      }
      static fromRGBA(A, t, e, r) {
        return i.fromRGB(A, t, e).withAlpha(r)
      }
      static fromRGBColor(A) {
        return i.fromRGB(A.r, A.g, A.b).withAlpha(A.a)
      }
    }
  }
}
;