/** * GameState & Free-For-All Match Manager * WarFront.io System Module */ export const SystemModule_GameState = {
  7726:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      FFAGameMode:()=>m
    }
    );
    var r=e(7798), i=e(3527);
    class s {
      canAttack(A, t) {
        return A!==t&&t!==r.Q.OWNER_NONE-1
      }
      processPlayerColor(A, t) {
        return t
      }
      keepAlive(A) {
        return i.r.isSelecting
      }
    }
    var a=e(6139), n=e(1733), o=e(5765);
    let q=[];
    n.om.register((()=> {
      q=[...o.b.getPlayers()]
    }
    )), a.p.registry.register((()=> {
      q.sort(((A, t)=>t.getTerritorySize()-A.getTerritorySize()))
    }
    ));
    class V {
      constructor(A) {
        this.time=a.p.getElapsedTime(), this.winners=A
      }
    }
    var d=e(3153);
    class h extends V {
      constructor(A) {
        super([A])
      }
      getWinnerString() {
        return (0, d.t)("game.winner.single", {
          name:this.winners[0].name
        }
        )
      }
    }
    var g=e(3457), u=e(9087);
    class m extends s {
      getResult() {
        const A=o.b.getPlayers().reduce(((A, t)=>A+t.getTerritorySize()), 0);
        return q[0].getTerritorySize()>.9*A?new h(q[0]):null
      }
    }
    (0, g.NE)(u.o.FFA, new m)
  }
  , 8275:(A, t, e)=> {
    "use strict";
    e.d(t, {
      X:()=>r, s:()=>a
    }
    );
    var r, i=e(8349);
    class s {
      constructor() {
        this.listeners=new i.j
      }
      register(A, t=0) {
        this.listeners.add(A, t)
      }
      unregister(A) {
        this.listeners.remove(A)
      }
      reset() {
        this.currentListener=void 0
      }
      has() {
        return void 0!==this.currentListener
      }
      choose(...A) {
        this.currentListener=this.listeners.find((t=>t.test(...A)))
      }
      call(A) {
        this.currentListener&&A(this.currentListener)
      }
    }
    !function (A) {
      A[A.CLICK=0]="CLICK", A[A.PRESS=1]="PRESS", A[A.DRAG=2]="DRAG", A[A.SCROLL=3]="SCROLL", A[A.MULTITOUCH=4]="MULTITOUCH", A[A.HOVER=5]="HOVER", A[A.KEYBOARD=6]="KEYBOARD"
    }
    (r||(r= {
    }
    ));
    const a=new class {
      constructor() {
        this.click=new s, this.press=new s, this.drag=new s, this.scroll=new s, this.multitouch=new s, this.hover=new s, this.keyboard=new s, this.draggable=new Set, this.dragTimeout=null, this.pressX=0, this.pressY=0, this.pressTarget=null, this.touchPoints=new Map, document.addEventListener("pointerdown", this.onPointerDown, {
          passive:!0
        }
        ), document.addEventListener("pointerup", this.onPointerUp, {
          passive:!0
        }
        ), document.addEventListener("pointerleave", this.onPointerUp, {
          passive:!0
        }
        ), document.addEventListener("pointercancel", this.onPointerUp, {
          passive:!0
        }
        ), document.addEventListener("pointermove", this.onHover, {
          passive:!0
        }
        ), document.addEventListener("wheel", this.onScroll, {
          passive:!1
        }
        ), document.addEventListener("keydown", this.onKeyDown, {
          passive:!1
        }
        ), document.addEventListener("keyup", this.onKeyUp, {
          passive:!0
        }
        )
      }
      onPointerDown(A) {
        a.touchPoints.set(A.pointerId, {
          x:A.x, y:A.y
        }
        ), a.touchPoints.size>1||(a.pressX=A.x, a.pressY=A.y, a.pressTarget=A.target, A.target&&a.draggable.has(A.target)&&(a.dragTimeout=setTimeout(a.startDrag, 1e3)), a.press.choose(A.x, A.y, A.target), a.press.call((t=>t.onClick(A.x, A.y))))
      }
      onPointerUp(A) {
        if (a.touchPoints.delete(A.pointerId), a.touchPoints.size>0) {
          if (1===a.touchPoints.size) {
            const A=a.touchPoints.values().next().value;
            a.pressX=A.x, a.pressY=A.y
          }
        }
        else a.dragTimeout&&(clearTimeout(a.dragTimeout), a.dragTimeout=null), a.drag.has()?(a.drag.call((t=>t.onDragEnd(A.x, A.y))), a.drag.reset()):A.target===a.pressTarget&&(a.click.choose(A.x, A.y, A.target), a.click.call((t=>t.onClick(A.x, A.y))))
      }
      onHover(A) {
        if (a.dragTimeout) {
          if (Math.abs(A.x-a.pressX)+Math.abs(A.y-a.pressY)<10)return;
          clearTimeout(a.dragTimeout), a.startDrag()
        }
        a.touchPoints.size>1?a.checkMobileGesture(A):(a.drag.call((t=>t.onDragMove(A.x, A.y, A.x-a.pressX, A.y-a.pressY))), a.pressX=A.x, a.pressY=A.y, a.hover.choose(A.x, A.y, A.target), a.hover.call((t=>t.onHover(A.x, A.y))))
      }
      startDrag() {
        a.dragTimeout=null, a.drag.choose(a.pressX, a.pressY, a.pressTarget), a.drag.call((A=>A.onDragStart(a.pressX, a.pressY)))
      }
      onScroll(A) {
        let t=A.deltaY;
        A.ctrlKey&&(A.preventDefault(), t*=7), a.scroll.choose(A.x, A.y, A.target), a.scroll.call((e=>e.onScroll(A.x, A.y, t)))
      }
      checkMobileGesture(A) {
        if (2!==a.touchPoints.size)return;
        const [t, e]=Array.from(a.touchPoints.values());
        a.touchPoints.set(A.pointerId, {
          x:A.x, y:A.y
        }
        );
        const [r, i]=Array.from(a.touchPoints.values()), s=Math.hypot(t.x-e.x, t.y-e.y), n=Math.hypot(r.x-i.x, r.y-i.y)/s, o=(t.x+e.x)/2, q=(t.y+e.y)/2, V=(r.x+i.x)/2, d=(r.y+i.y)/2;
        a.multitouch.choose(V, d, A.target), a.multitouch.call((A=>A.onMultiTouch(o, q, V, d, n)))
      }
      onKeyDown(A) {
        const t=new Set;
        A.altKey&&t.add("Alt"), A.ctrlKey&&t.add("Control"), A.metaKey&&t.add("Meta"), A.shiftKey&&t.add("Shift"), t.add(A.key===A.key.toLowerCase()?A.key.toUpperCase():A.key), a.keyboard.choose(a.pressX, a.pressY, A.target, t), a.keyboard.call((A=>A.onKeyDown(t, a.pressX, a.pressY)))
      }
      onKeyUp(A) {
        a.keyboard.call((t=>t.onKeyUp(A.key===A.key.toLowerCase()?A.key.toUpperCase():A.key, a.pressX, a.pressY)))
      }
    }
  }
  , 7798:(A, t, e)=> {
    "use strict";
    e.d(t, {
      Q:()=>a
    }
    );
    var r=e(5765), i=e(8621), s=e(3446);
    const a=new class {
      constructor() {
        this.OWNER_NONE=65535
      }
      reset() {
        this.tileOwners=new Uint16Array(i.hf.width*i.hf.height);
        for (let A=0;
        A<this.tileOwners.length;
        A++)this.tileOwners[A]=i.hf.getTile(A).conquerable?this.OWNER_NONE:this.OWNER_NONE-1
      }
      isBorder(A) {
        const t=A%i.hf.width, e=Math.floor(A/i.hf.width), r=this.tileOwners[A];
        return 0===t||t===i.hf.width-1||0===e||e===i.hf.height-1||this.tileOwners[A-1]!==r||this.tileOwners[A+1]!==r||this.tileOwners[A-i.hf.width]!==r||this.tileOwners[A+i.hf.width]!==r
      }
      hasOwner(A) {
        return this.tileOwners[A]!==this.OWNER_NONE
      }
      isOwner(A, t) {
        return this.tileOwners[A]===t
      }
      getOwner(A) {
        return this.tileOwners[A]
      }
      isWater(A) {
        return this.tileOwners[A]===this.OWNER_NONE-1
      }
      conquer(A, t, e) {
        const i=this.tileOwners[A];
        this.tileOwners[A]=t, i!==this.OWNER_NONE&&r.b.getPlayer(i).removeTile(A), r.b.getPlayer(t).addTile(A), e.addTile(A), s.r.handleTerritoryAdd(A, t)
      }
      clear(A, t) {
        const e=this.tileOwners[A];
        e!==this.OWNER_NONE&&(this.tileOwners[A]=this.OWNER_NONE, r.b.getPlayer(e).removeTile(A), t.addTile(A))
      }
    }
  }
  , 8621:(A, t, e)=> {
    "use strict";
    let r, i, s, a;
    function n(A, t, e) {
      r=A, i=t, a=e, s=!0
    }
    function o() {
      s=!1
    }
    e.d(t, {
      F4:()=>s, WT:()=>a, aP:()=>o, hf:()=>r, ot:()=>i, pg:()=>n
    }
    )
  }
  , 1733:(A, t, e)=> {
    "use strict";
    e.d(t, {
      Hk:()=>B, K1:()=>p, N1:()=>E, U6:()=>l, om:()=>M, qU:()=>f, rP:()=>z, zj:()=>m
    }
    );
    var r=e(7798), i=e(5765), s=e(5156), a=e(3527), n=e(448), o=e(3446), q=e(2902), V=e(8621), d=e(1151), h=e(504), g=e(3434), u=e(6139);
    function m(A, t, e, h, u, m) {
      (0, V.pg)(A, t, m), P.broadcast(), r.Q.reset();
      const l=a.r.init(500);
      g.g.reset(l), o.r.init(l), i.b.init(h.map(((A, t)=>new(t===u?d.J:s.a)(t, A.name, q.l.fromRGB(0, 200, 200)))), u, l), n.y.reset(e), M.broadcast(), i.b.randomizeSpawnPoints()
    }
    function l() {
      u.p.start(), p.broadcast(), w.broadcast()
    }
    function B() {
      u.p.pause(), Z.broadcast()
    }
    function f() {
      E.broadcast(), u.p.stop(), Z.broadcast(), (0, V.aP)()
    }
    const P=new h.I, M=new h.I, p=new h.I, Z=new h.I, w=new h.I, z=new h.I, E=new h.I
  }
  , 9945:(A, t, e)=> {
    "use strict";
    e.d(t, {
      PO:()=>P, CS:()=>Z, vs:()=>w, HM:()=>M, J_:()=>z
    }
    );
    var r=e(7991), i=e(4686), s=e(5861), a=e(1995), n=e(46), o=e(9983), q=e(398), V=e(668), d=e(8621), h=e(7315), g=e(7830), u=e(504), m=e(1733);
    let l, B=null, f=!1;
    function P(A, t=void 0) {
      return new Promise(((e, d)=> {
        const u=new URL(A);
        let m;
        if ("warfront.io"===u.hostname||"gateway.warfront.io"===u.hostname?(u.protocol="wss:", u.hostname="gateway.warfront.io", m=(0, i.dG)().refresh().then((A=>A.getRawToken()))):(u.protocol="http:"===u.protocol||"ws:"===u.protocol?"ws:":"wss:", m=new Promise((A=> {
          (0, s.i6)( {
            host:u.hostname
          }
          ).on(200, (t=>A(t))).catch((()=>A(void 0)))
        }
        ))), u.searchParams.set("v", r.W.toString()), null!==B&&B.close(), B=new WebSocket(u.href), B.binaryType="arraybuffer", B.onopen=()=> {
          console.log("Socket opened"), m.then((A=> {
            try {
              w(new n.S(r.W, (0, o.PL)("player-name"), A), !0), (15e3, t=A=> {
                g.A6.handle(a.r, (function () {
                  A()
                }
                ))
              }
              , Promise.race([new Promise(t), new Promise(((A, t)=>setTimeout((()=>t(new Error("Time out"))), 15e3)))])).then((()=> {
                f=!0, e()
              }
              )).catch(d)
            }
            catch(A) {
              console.error("Failed to send auth packet", A), d(A)
            }
            var t
          }
          )).catch(d)
        }
        , B.onclose=A=> {
          clearTimeout(l), f=!1, d(new h.CX("Socket closed")), M.broadcast(A.code), A.code!==q.q.NO_ERROR&&console.error(`Socket closed with code $ {
            A.code
          }
          `)
        }
        , B.onerror=()=> {
        }
        , B.onmessage=A=> {
          if ((null==B?void 0:B.readyState)===WebSocket.OPEN)if (A.data instanceof ArrayBuffer)try {
            (0, V.o)(new Uint8Array(A.data), g.A6).handle(), p()
          }
          catch(A) {
            console.error("Failed to handle packet", A), B.close(q.q.BAD_MESSAGE)
          }
          else B.close(q.q.BAD_MESSAGE)
        }
        , p(), t)try {
          if (t.aborted)return void(null==B||B.close(q.q.NO_ERROR));
          t.addEventListener("abort", (()=> {
            null==B||B.close(q.q.NO_ERROR)
          }
          ))
        }
        catch(A) {
          console.error("Failed to add abort listener", A)
        }
      }
      ))
    }
    const M=new u.I;
    function p() {
      clearTimeout(l), l=setTimeout((()=> {
        null==B||B.close(q.q.NO_ERROR)
      }
      ), 3e4)
    }
    function Z() {
      null==B||B.close(q.q.NO_ERROR)
    }
    function w(A, t=!1) {
      if (!B||!t&&!f||B.readyState!==WebSocket.OPEN)throw new h.CX("Socket is not open or not connected");
      B.send(A.transferContext.serialize(A, g.A6))
    }
    function z(A) {
      (0, g.dN)(A)&&(d.WT?g.A6.getPacketHandler(A.id).call(A):w(A))
    }
    m.N1.register(Z)
  }
}
;