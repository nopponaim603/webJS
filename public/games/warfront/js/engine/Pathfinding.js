/** * Bresenham Line-of-Sight & Boat Route Calculation * WarFront.io System Module */ export const SystemModule_Pathfinding = {
  8348:(A, t, e)=> {
    "use strict";
    function r(A, t, e, r, s) {
      if (A===e&&t===r)return !0;
      const a=e-A, n=r-t, o=Math.max(Math.abs(a), Math.abs(n)), q=a/o, V=n/o;
      let d=A+.5, h=t+.5;
      if (-1===s.getDistance(A+t*s.width)&&!i(d, h, q, V, s))return !1;
      if (-1===s.getDistance(e+r*s.width)&&!i(e+.5, r+.5, -q, -V, s))return !1;
      for (let A=1;
      A<o;
      A++) {
        d+=q, h+=V;
        const A=s.getDistance(Math.floor(d)+Math.floor(h)*s.width);
        if (A>=0)return !1;
        if (-1===A) {
          if (0===a||0===n)continue;
          if (!i(d, h, q, V, s)||!i(d, h, -q, -V, s))return !1
        }
      }
      return !0
    }
    function i(A, t, e, r, i) {
      if (Math.abs(e)>Math.abs(r)) {
        if (i.getDistance(Math.floor(A)+Math.floor(t+r-.49)*i.width)>=0)return !1;
        if (i.getDistance(Math.floor(A)+Math.floor(t+r+.49)*i.width)>=0)return !1
      }
      else {
        if (i.getDistance(Math.floor(A+e-.49)+Math.floor(t)*i.width)>=0)return !1;
        if (i.getDistance(Math.floor(A+e+.49)+Math.floor(t)*i.width)>=0)return !1
      }
      return !0
    }
    e.d(t, {
      P:()=>r
    }
    )
  }
  , 1151:(A, t, e)=> {
    "use strict";
    e.d(t, {
      J:()=>o, l:()=>q
    }
    );
    var r=e(5156), i=e(4830), s=e(7798), a=e(8621);
    let n;
    class o extends r.a {
      constructor(A, t, e) {
        super(A, t, e), n=new Uint16Array(i.ey.preprocessMap())
      }
      addTile(A) {
        super.addTile(A), a.hf.onNeighbors(A, (A=> {
          s.Q.isWater(A)&&n[i.ey.areaIndex[A]]++
        }
        ))
      }
      removeTile(A) {
        super.removeTile(A), a.hf.onNeighbors(A, (A=> {
          s.Q.isWater(A)&&n[i.ey.areaIndex[A]]--
        }
        ))
      }
    }
    function q(A) {
      return n[A]>0
    }
  }
  , 5156:(A, t, e)=> {
    "use strict";
    e.d(t, {
      a:()=>i
    }
    );
    var r=e(8621);
    class i {
      constructor(A, t, e) {
        this.troops=1e3, this.territorySize=0, this.alive=!0, this.id=A, this.name=t, this.baseColor=r.ot.processPlayerColor(A, e)
      }
      addTile(A) {
        this.territorySize++
      }
      removeTile(A) {
        this.territorySize--, 0!==this.territorySize||r.ot.keepAlive(this)||(this.alive=!1)
      }
      income() {
        this.addTroops(Math.max(1, Math.floor(this.territorySize/10)+Math.floor(Math.pow(.6, 1-Math.log(this.troops+1)/Math.LN2))))
      }
      getTroops() {
        return this.troops
      }
      addTroops(A) {
        this.troops=Math.min(100*this.territorySize, this.troops+A)
      }
      removeTroops(A) {
        this.troops=Math.max(0, this.troops-A)
      }
      getTerritorySize() {
        return this.territorySize
      }
      isAlive() {
        return this.alive
      }
    }
  }
}
;