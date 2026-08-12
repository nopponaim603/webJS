/** * UIManager Component Registry, Modals & Tooltips * WarFront.io System Module */ export const SystemModule_UIManager = {
  654:(A, t, e)=> {
    "use strict";
    e.d(t, {
      Rx:()=>d, S9:()=>q, Td:()=>V, XA:()=>h, hk:()=>u, kf:()=>g, uh:()=>o
    }
    );
    var r=e(7315), i=e(9983), s=e(3433);
    const a=new Map, n=new Set;
    function o(A, t) {
      if (a.has(A))throw new r.Qn(`UI element with name $ {
        A
      }
      is already registered`);
      a.set(A, t)
    }
    function q(A) {
      const t=a.get(A);
      if (t) {
        if (n.has(A))return;
        t.showListeners.broadcast(), n.add(A)
      }
      else console.warn(`UI element with name $ {
        A
      }
      is not registered`)
    }
    function V(A) {
      const t=a.get(A);
      if (t) {
        if (!n.has(A))return;
        t.hideListeners.broadcast(), n.delete(A)
      }
      else console.warn(`UI element with name $ {
        A
      }
      is not registered`)
    }
    function d() {
      n.forEach(V)
    }
    function h(A) {
      const t=a.get(A);
      if (!t)throw new r.Qn(`UI element with name $ {
        A
      }
      is not registered`);
      return t
    }
    function g() {
      const A=Array.from(n).pop();
      return A?h(A):null
    }
    function u(A) {
      const t=document.getElementById(A);
      if (!t)throw new r.Qn(`Element with id $ {
        A
      }
      is not a valid static UI element`);
      t.style.position="absolute", t.style.width="100%", t.style.height="100%", o(A, new s.Y4(t, t))
    }
    (0, i.kV)("theme", (A=> {
      (0, i.Wr)("theme").isInitialized()&&document.documentElement.classList.remove("theme-"+(0, i.PL)("theme").id), document.documentElement.classList.add("theme-"+A.id)
    }
    ))
  }
  , 3089:(A, t, e)=> {
    "use strict";
    e.d(t, {
      D$:()=>o, Mz:()=>i, o3:()=>r, tI:()=>q
    }
    );
    var r, i, s=e(7315), a=e(504), n=e(7859);
    class o {
      constructor(A) {
        this.showListeners=new a.I, this.hideListeners=new a.I, this.destroyList=[], this.element=q(A), this.initDefaultListeners()
      }
      initDefaultListeners() {
        this.showListeners.register((()=>this.element.style.display="")), this.hideListeners.register((()=>this.element.style.display="none"))
      }
      getElement() {
        return this.element
      }
      setAttribute(A, t) {
        return this.element.setAttribute(A, t), this
      }
      onShow(A) {
        return this.makeResolvable(), this.showListeners.register(A), this
      }
      onClick(A) {
        return this.makeResolvable(), (0, n.C_)(this.element, A), this
      }
      onDrag(A, t, e) {
        return this.makeResolvable(), (0, n.iZ)(this.element, A, t, e), this
      }
      onScroll(A) {
        return this.makeResolvable(), (0, n.j5)(this.element, A), this
      }
      onMultiTouch(A) {
        return this.makeResolvable(), (0, n.qO)(this.element, A), this
      }
      onHover(A) {
        return this.makeResolvable(), (0, n.cS)(this.element, A), this
      }
      handleRegistry(A, t) {
        A.register(t), this.destroyList.push((()=>A.unregister(t)))
      }
      getClientHeight() {
        return this.element.getBoundingClientRect().height+parseFloat(getComputedStyle(this.element).marginTop)+parseFloat(getComputedStyle(this.element).marginBottom)
      }
      addBodyClass(...A) {
        return this.element.classList.add(...A), this
      }
      destroy() {
        (0, n.Yz)(this.element.id), this.destroyList.forEach((A=>A()))
      }
      makeResolvable() {
        ""===this.element.id&&(this.element.id=`element-$ {
          Math.random().toString(36).substring(2,15)
        }
        `)
      }
    }
    function q(A) {
      if (A instanceof HTMLElement)return A;
      const t=document.getElementById(A);
      if (!t)throw new s.Qn(`Element with id $ {
        A
      }
      not found`);
      return t
    }
    !function (A) {
      A[A.NORTH=0]="NORTH", A[A.EAST=1]="EAST", A[A.SOUTH=2]="SOUTH", A[A.WEST=3]="WEST"
    }
    (r||(r= {
    }
    )), function (A) {
      A[A.TOP_LEFT=0]="TOP_LEFT", A[A.TOP_CENTER=1]="TOP_CENTER", A[A.TOP_RIGHT=2]="TOP_RIGHT", A[A.MIDDLE_LEFT=3]="MIDDLE_LEFT", A[A.MIDDLE_CENTER=4]="MIDDLE_CENTER", A[A.MIDDLE_RIGHT=5]="MIDDLE_RIGHT", A[A.BOTTOM_LEFT=6]="BOTTOM_LEFT", A[A.BOTTOM_CENTER=7]="BOTTOM_CENTER", A[A.BOTTOM_RIGHT=8]="BOTTOM_RIGHT"
    }
    (i||(i= {
    }
    ))
  }
  , 3433:(A, t, e)=> {
    "use strict";
    e.d(t, {
      UY:()=>a, Y4:()=>i, a0:()=>s
    }
    );
    var r=e(3089);
    class i extends r.D$ {
      constructor(A, t) {
        super(A), this.children=[], this.bodyElement=t, this.showListeners.register((()=>this.children.forEach((A=>A.showListeners.broadcast())))), this.hideListeners.register((()=>this.children.forEach((A=>A.hideListeners.broadcast()))))
      }
      add(A) {
        return this.bodyElement.appendChild(A.getElement()), this.children.push(A), this
      }
      anchor(A, t) {
        return A.getElement().classList.add("anchor-"+r.Mz[t].toLowerCase().replace("_", "-")), this.add(A)
      }
      attach(A, t) {
        const e="attach-"+r.o3[t].toLowerCase();
        return A.getElement().classList.add(e), this.add(A)
      }
      setContent(...A) {
        return this.bodyElement.replaceChildren(...A.map((A=>A.getElement()))), this.children.forEach((A=>A.destroy())), this.children=A, this
      }
      getChildren() {
        return this.children
      }
      addBodyClass(...A) {
        return this.bodyElement.classList.add(...A), this
      }
      destroy() {
        super.destroy(), this.children.forEach((A=>A.destroy()))
      }
    }
    function s(A, ...t) {
      const e=document.createElement("div");
      e.classList.add("content-field", "content-field-"+A);
      const r=new i(e, e);
      return r.setContent(...t), r
    }
    function a(...A) {
      const t=document.createElement("div");
      return t.classList.add(...A), new i(t, t)
    }
  }
  , 1896:(A, t, e)=> {
    "use strict";
    e.d(t, {
      LA:()=>n, S7:()=>q, W5:()=>V, bb:()=>d
    }
    );
    var r=e(7859), i=e(654), s=e(3433);
    class a extends s.Y4 {
      constructor(A, t, e) {
        super(A, t), this.closeHandler=()=> {
        }
        , this.titleElement=e
      }
      initDefaultListeners() {
        this.showListeners.register((()=>this.element.showModal())), this.hideListeners.register((()=>this.element.close()))
      }
      setTitle(A) {
        return this.titleElement.textContent=A, this
      }
      setCloseHandler(A) {
        return this.closeHandler=A, this
      }
      getCloseHandler() {
        return this.closeHandler
      }
    }
    function n(A) {
      const t=document.createElement("dialog");
      t.id=A, t.classList.add("layout-window", "flex-centered", "background-blur"), t.style.zIndex="100";
      const e=document.createElement("div");
      e.classList.add("panel", "w-100"), e.style.maxWidth="960px";
      const s=document.createElement("a");
      s.classList.add("icon-fixed", "icon-close"), s.id=A+"Close", s.tabIndex=0, s.autofocus=!0, e.appendChild(s);
      const n=document.createElement("h2");
      n.classList.add("panel-header"), e.appendChild(n);
      const o=document.createElement("div");
      o.classList.add("panel-body"), e.appendChild(o), t.appendChild(e), document.body.appendChild(t);
      const q=new a(t, o, n);
      return (0, i.uh)(A, q), q.setCloseHandler((()=>(0, i.Td)(A))), t.addEventListener("cancel", (A=> {
        A.preventDefault(), q.getCloseHandler()()
      }
      )), (0, r.C_)(s, (()=>q.getCloseHandler()())), (0, r.gO)(t), q
    }
    const o=n("defaultPanel");
    function q(A, ...t) {
      return o.setTitle(A).setContent(...t), (0, i.S9)("defaultPanel"), o
    }
    function V(...A) {
      o.setContent(...A)
    }
    function d() {
      (0, i.Td)("defaultPanel")
    }
  }
  , 1291:(A, t, e)=> {
    "use strict";
    var r=e(596), i=e(9983), s=e(3889), a=e(1896), n=e(3946), o=e(3433), q=e(3089);
    class V extends q.D$ {
      constructor() {
        super(...arguments), this.tooltipElement=null, this.tooltipTimeout=null
      }
      showTooltip(A, t) {
        this.tooltipElement&&this.element.removeChild(this.tooltipElement);
        const e=document.createElement("div");
        return e.classList.add("tooltip", "tooltip-"+t), e.textContent=A, this.tooltipElement=e, this.element.appendChild(e), this
      }
      showTemporaryTooltip(A, t, e) {
        return this.showTooltip(A, t), this.tooltipTimeout&&clearTimeout(this.tooltipTimeout), this.tooltipTimeout=setTimeout((()=>this.hideTooltip()), e), this
      }
      hideTooltip() {
        return this.tooltipElement&&(this.element.removeChild(this.tooltipElement), this.tooltipElement=null), this
      }
    }
    class d extends q.D$ {
      constructor(A, t, e) {
        super(A), this.titleElement=t, this.contentElement=e, this.tooltipContainer=function (A) {
          return A.style.position="relative", new V(A)
        }
        (this.contentElement), e.addEventListener("click", (()=>this.copy()))
      }
      setTitle(A) {
        return this.titleElement.innerText=A, this
      }
      setContent(A) {
        return this.contentElement.innerText=A, this
      }
      copy() {
        var A;
        return navigator.clipboard.writeText(null!==(A=this.contentElement.childNodes[0].textContent)&&void 0!==A?A:"").then((()=>this.tooltipContainer.showTemporaryTooltip("Copied!", "success", 1e3))).catch((A=> {
          console.error(A), this.tooltipContainer.showTemporaryTooltip("Failed to copy :c", "danger", 2e3)
        }
        )), this
      }
    }
    function h(A, t, e=[], r=[]) {
      const i=document.createElement("span"), s=document.createElement("span");
      s.classList.add(...e), s.textContent=A, i.appendChild(s);
      const a=document.createElement("span");
      return a.classList.add(...r), a.textContent=t, i.appendChild(a), new d(i, s, a)
    }
    const g=(0, r.getSettingTab)(i.th);
    if (!g)throw new Error("Settings tab not found");
    g.add((0, o.UY)().add((0, s.Pe)("Debug Events").onClick((()=> {
      const A=[];
      for (const t of(0, n.J)())A.push((0, o.a0)("secondary", (0, s.x1)(t.name, "mb-1_2"), ...t.data.map((A=>h(A.name, JSON.stringify(A.value), ["data-copy-title"], ["data-copy-content"])))).anchor((0, s.M$)(new Date(t.time).toLocaleTimeString(), "m-1_2"), q.Mz.TOP_RIGHT));
      0===A.length&&A.push((0, s.x1)("No debug events have been triggered")), (0, a.S7)("Debug Events", ...A)
    }
    ))))
  }
  , 1716:(A, t, e)=> {
    "use strict";
    var r=e(6139), i=e(3748), s=e(9983), a=e(7859), n=e(654), o=e(8275), q=e(3089), V=e(2580), d=e(5765), h=e(3527), g=e(5388), u=e(7798), m=e(1744), l=e(8621), B=e(9945), f=e(8488), P=e(1733), M=e(8078), p=e(9021), Z=e(848);
    class w {
      setAction(A) {
        this.action=A
      }
      setPower(A) {
        this.power=A
      }
      onClick(A, t) {
        this.action(V.L.getIndex(A, t))
      }
      test(A, t, e) {
        return l.F4&&!r.p.isPaused&&V.L.isOnMap(A, t)
      }
      static spawnSelectAction(A) {
        u.Q.getOwner(A)!==u.Q.OWNER_NONE-1&&h.r.isValidSpawnPoint(A)&&(l.WT?(h.r.selectSpawnPoint(d.B.id, A), h.r.finalizeSelection()):(0, B.vs)(new f.Z(A)))
      }
      static attackAction(A) {
        if ((0, m.t)(d.B, u.Q.getOwner(A)))(0, B.J_)(new M.x(d.B.id, u.Q.getOwner(A)===u.Q.OWNER_NONE?d.B.id:u.Q.getOwner(A), z.power));
        else {
          const t=g.G.findCoastNear(A);
          if (null===t)return;
          const e=(0, p.S)(t);
          if (null===e)return;
          (0, B.J_)(new Z.$(d.B.id, e, t, z.power))
        }
      }
    }
    const z=new w;
    o.s.click.register(z, -100), P.om.register((()=>z.setAction(w.spawnSelectAction))), P.K1.register((()=>z.setAction(w.attackAction)));
    var E=e(1896), D=e(3153), c=e(3889);
    (0, n.hk)("GameHud"), (0, a.C_)("openSettings", (()=>(0, n.S9)("SettingsPanel"))), (0, a.C_)("exitGame", (()=>window.location.reload()));
    const I=window.document.getElementById("gameClock");
    r.p.registry.register((()=>I.innerHTML=(0, i.f)(r.p.getElapsedTime()))), (0, s.kV)("hud-clock", (A=>I.style.display=A?"inherit":"none")), o.s.draggable.add((0, q.tI)("GameHudContainer"));
    const H=(0, q.tI)("sliderAttackStrength");
    o.s.draggable.add(H);
    const C=A=>v((A-H.getBoundingClientRect().left)/H.getBoundingClientRect().width);
    (0, a.C_)(H, C, !0, !0), (0, a.iZ)(H, C, C, (()=> {
    }
    ));
    const U=(0, q.tI)("sliderAttackHidden");
    U.onchange=()=>v(parseInt(U.value)/100);
    const G=(0, q.tI)("sliderAttackNumber");
    let Q=!1;
    function v(A) {
      A<0&&(A=0), A>1&&(A=1), H.style.setProperty("--value", A.toString()), A>.2&&Q?(G.classList.add("selector-number-reversed"), Q=!1):A<.2&&!Q&&(G.classList.remove("selector-number-reversed"), Q=!0), U.value=(100*A).toString();
      const t=Math.expm1(2*Math.LN2*A)/3;
      G.innerHTML=(100*t).toFixed(1)+"%", z.setPower(1e3*t)
    }
    const K=(0, q.tI)("selectorTroopCount"), R=(0, q.tI)("selectorDensityNumber");
    r.p.registry.register((()=> {
      K.innerText=(0, i.L)(d.B.getTroops()), R.innerText=(d.B.getTroops()/d.B.getTerritorySize()).toFixed(2)+"%"
    }
    )), P.om.register((()=> {
      (0, n.Rx)(), (0, n.S9)("GameHud"), v(.5), K.innerText=(0, i.L)(d.B.getTroops()), R.innerText=(d.B.getTroops()/d.B.getTerritorySize()).toFixed(2)+"%"
    }
    )), (0, a.gO)(I), (0, a.gO)((0, q.tI)("selectorContainer")), P.rP.register((A=> {
      (0, E.S7)((0, D.t)("game.result.title"), (0, c.M$)(A.getWinnerString()), (0, c.Pe)((0, D.t)("game.action.leave"), "danger", "btn-block").onClick((()=>window.location.reload())))
    }
    ))
  }
  , 3889:(A, t, e)=> {
    "use strict";
    e.d(t, {
      AA:()=>n, M$:()=>s, Pe:()=>o, Pl:()=>q, x1:()=>a
    }
    );
    var r=e(3089);
    class i extends r.D$ {
      setText(A) {
        return this.element.textContent=A, this
      }
    }
    function s(A, ...t) {
      const e=document.createElement("span");
      return e.classList.add(...t), e.textContent=A, new i(e)
    }
    function a(A, ...t) {
      const e=document.createElement("h3");
      return e.classList.add(...t), e.textContent=A, new i(e)
    }
    function n(A, ...t) {
      const e=document.createElement("a");
      return e.classList.add("icon-fixed", "icon-"+A, ...t), new i(e)
    }
    function o(A, t="primary", ...e) {
      const r=document.createElement("button");
      return r.classList.add("btn", "btn-"+t, ...e), new i(r).setText(A)
    }
    function q(A, t, e="normal") {
      const r=function (A, t, e="normal") {
        const r=document.createElement("div");
        return r.classList.add("alert", "alert-"+A, "alert-"+e), new i(r).setText(t)
      }
      (A, t, e);
      setTimeout((()=> {
        r.destroy(), document.body.removeChild(r.getElement())
      }
      ), "fast"===e?3e3:"slow"===e?1e4:5e3), document.body.appendChild(r.getElement())
    }
  }
}
;