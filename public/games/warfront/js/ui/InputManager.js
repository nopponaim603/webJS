/** * InputManager Mouse, Touch, Drag & Scroll Dispatcher * WarFront.io System Module */ export const SystemModule_InputManager = {
  7859:(A, t, e)=> {
    "use strict";
    e.d(t, {
      C_:()=>g, Yz:()=>M, cS:()=>B, gO:()=>P, iZ:()=>u, j5:()=>m, qO:()=>l
    }
    );
    var r=e(8275), i=e(3089), s=e(7315), a=e(3532), n=e(654);
    const o= {
      [r.X.CLICK]:new Map, [r.X.PRESS]:new Map, [r.X.DRAG]:new Map, [r.X.SCROLL]:new Map, [r.X.MULTITOUCH]:new Map, [r.X.HOVER]:new Map, [r.X.KEYBOARD]:new Map
    }
    , q=new a.a((()=>[])), V=new a.a((()=>[]));
    function d(A, t, e) {
      if (!A||""===A.id||!o[t].has(A.id)||t===r.X.KEYBOARD&&e&&q.getOrSet(A.id).every((A=>[...A.keys].some((A=>!e.has(A))))))return A&&A.parentElement?d(A.parentElement, t, e):null;
      if (A.disabled)return null;
      const i=o[t].get(A.id);
      if (!i)throw new s.xd(`Listener for element $ {
        A.id
      }
      is null`);
      return {
        id:A.id, listener:i
      }
    }
    function h(A) {
      let t;
      return new Proxy( {
      }
      , {
        get:(e, i)=>"test"===i?(e, i, s, a)=> {
          var o;
          if (A===r.X.KEYBOARD&&s===document.body) {
            const A=(0, n.kf)();
            A&&(s=A.getElement())
          }
          return t=null===(o=d(s, A, a))||void 0===o?void 0:o.listener, !!t
        }
        :null==t?void 0:t[i]
      }
      )
    }
    function g(A, t, e=!0, s=!1) {
      o[s?r.X.PRESS:r.X.CLICK].set((0, i.tI)(A).id, {
        onClick:t
      }
      ), e&&(f(A, "Enter", t), f(A, " ", t))
    }
    function u(A, t, e, s) {
      o[r.X.DRAG].set((0, i.tI)(A).id, {
        onDragStart:t, onDragMove:e, onDragEnd:s
      }
      )
    }
    function m(A, t) {
      o[r.X.SCROLL].set((0, i.tI)(A).id, {
        onScroll:t
      }
      )
    }
    function l(A, t) {
      o[r.X.MULTITOUCH].set((0, i.tI)(A).id, {
        onMultiTouch:t
      }
      )
    }
    function B(A, t) {
      o[r.X.HOVER].set((0, i.tI)(A).id, {
        onHover:t
      }
      )
    }
    function f(A, t, e, s) {
      const a=(0, i.tI)(A);
      q.getOrSet(a.id).push( {
        keys:new Set(Array.isArray(t)?t:[t]), handler:e
      }
      ), s&&V.getOrSet(a.id).push( {
        keys:new Set([Array.isArray(t)?t[0]:t]), handler:s
      }
      ), function (A) {
        o[r.X.KEYBOARD].has(A.id)||o[r.X.KEYBOARD].set(A.id, {
          onKeyDown(t, e, r) {
            let i=0, s=null;
            for (const e of q.getOrSet(A.id))[...e.keys].every((A=>t.has(A)))&&e.keys.size>i&&(i=e.keys.size, s=e.handler);
            s&&s(e, r)
          }
          , onKeyUp:(t, e, r)=> {
            V.getOrSet(A.id).forEach((A=> {
              A.keys.has(t)&&A.handler(e, r)
            }
            ))
          }
        }
        )
      }
      (a)
    }
    function P(A) {
      const t=(0, i.tI)(A);
      o[r.X.CLICK].set(t.id, {
        onClick:()=> {
        }
      }
      ), o[r.X.DRAG].set(t.id, {
        onDragStart:()=> {
        }
        , onDragMove:()=> {
        }
        , onDragEnd:()=> {
        }
      }
      ), o[r.X.SCROLL].set(t.id, {
        onScroll:()=> {
        }
      }
      ), o[r.X.MULTITOUCH].set(t.id, {
        onMultiTouch:()=> {
        }
      }
      ), o[r.X.HOVER].set(t.id, {
        onHover:()=> {
        }
      }
      ), o[r.X.KEYBOARD].set(t.id, {
        onKeyDown:()=> {
        }
        , onKeyUp:()=> {
        }
      }
      )
    }
    function M(A) {
      o[r.X.CLICK].delete(A), o[r.X.DRAG].delete(A), o[r.X.SCROLL].delete(A), o[r.X.MULTITOUCH].delete(A), o[r.X.HOVER].delete(A), o[r.X.KEYBOARD].delete(A), q.delete(A), V.delete(A)
    }
    r.s.click.register(h(r.X.CLICK)), r.s.press.register(h(r.X.PRESS)), r.s.drag.register(h(r.X.DRAG)), r.s.scroll.register(h(r.X.SCROLL)), r.s.multitouch.register(h(r.X.MULTITOUCH)), r.s.hover.register(h(r.X.HOVER)), r.s.keyboard.register(h(r.X.KEYBOARD))
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
}
;