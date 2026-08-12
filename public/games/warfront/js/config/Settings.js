/** * Settings Registry & LocalStorage Persistence * WarFront.io System Module */ export const SystemModule_Settings = {
  596:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      getSettingTab:()=>H, registerSettingType:()=>I, showMultiSelectPanel:()=>C
    }
    );
    var r=e(1896), i=e(3433), s=e(3889), a=e(3590), n=e(3089), o=e(504);
    class q extends n.D$ {
      constructor(A, t) {
        super(A), this.changeListeners=new o.I, t.addEventListener("change", (()=>this.changeListeners.broadcast(this.inputElement.checked))), this.inputElement=t
      }
      setChecked(A) {
        return this.inputElement.checked=A, this
      }
      isChecked() {
        return this.inputElement.checked
      }
      onChanged(A) {
        return this.changeListeners.register(A), this
      }
      linkSetting(A) {
        return this.handleRegistry(A.getRegistry(), (A=>this.setChecked(A))), this.onChanged((t=>A.set(t).save())), this
      }
      linkMultiSetting(A, t) {
        return this.handleRegistry(A.getRegistry(), ((A, e)=>this.setChecked(e.isSelected(t)))), this.onChanged((e=>A.select(t, e).save())), this
      }
    }
    function V(A) {
      const t=document.createElement("div"), e=document.createElement("label");
      e.classList.add("switch ");
      const r=document.createElement("input");
      r.type="checkbox", e.appendChild(r);
      const i=document.createElement("span");
      return i.classList.add("slider", "slider-round", "slider-primary"), e.appendChild(i), t.appendChild(e), t.appendChild(document.createTextNode(A)), new q(t, r)
    }
    class d extends n.D$ {
      constructor(A, t) {
        super(A), this.changeListeners=new o.I, t.addEventListener("change", (()=>this.changeListeners.broadcast(t.value))), this.select=t
      }
      addOption(A, t) {
        const e=document.createElement("option");
        return e.value=A, e.text=t, this.select.add(e), this
      }
      setValue(A) {
        return this.select.value=A, this
      }
      getValue() {
        return this.select.value
      }
      onChanged(A) {
        return this.changeListeners.register(A), this
      }
      linkSetting(A) {
        return this.handleRegistry(A.getOptionRegistry(), (A=>this.addOption(A, A))), this.handleRegistry(A.getRegistry(), ((A, t)=>this.setValue(t.getSelectedOption()))), this.onChanged((t=>A.select(t).save())), this
      }
    }
    var h=e(4231), g=e(7315), u=e(5439), m=e(3808), l=e(3360), B=e(4856), f=e(654), P=e(3153);
    const M=(0, i.UY)("settings-tab-container"), p=(0, i.UY)("settings-category-container"), Z=new Map, w=new Map;
    let z=null;
    (0, r.LA)("SettingsPanel").setTitle("Settings").addBodyClass("flex-row").add(M).add(p);
    let E=0;
    const D=new Map, c=[];
    function I(A, t) {
      const e=E++;
      A.prototype.settingMagicRendererId=e, D.set(e, t);
      for (const A of c)if (A.settingMagicRendererId===e) {
        const e=A.getCategory();
        if (!e)throw new g.xd("Setting has no category");
        const r=Z.get(e);
        if (!r)throw new g.xd("Category not found");
        r.add(t(A)), c.splice(c.indexOf(A), 1)
      }
    }
    function H(A) {
      return Z.get(A)
    }
    function C(A) {
      const t=[];
      for (const [e, r]of Object.entries(A.get()))t.push(V(r.label).linkMultiSetting(A, e));
      (0, r.S7)((0, P.Db)(`setting.select.$ {
        A.getSaveId()
      }
      .title`), ...t)
    }
    a.v.register((A=> {
      var t;
      const e=A.getCategory();
      if (!e)return;
      let r=Z.get(e);
      if (!r) {
        r=(0, i.UY)("settings-category").add((0, s.x1)(e.name)), p.add(r);
        const A=(0, i.UY)("settings-tab").add((0, s.AA)(null!==(t=e.icon)&&void 0!==t?t:"close").setAttribute("tabindex", "0")).onClick((()=> {
          var t, i;
          z&&(null===(t=Z.get(z))||void 0===t||t.getElement().classList.remove("settings-category-active"), null===(i=w.get(z))||void 0===i||i.getElement().classList.remove("settings-tab-active")), null==r||r.getElement().classList.add("settings-category-active"), A.getElement().classList.add("settings-tab-active"), z=e
        }
        ));
        M.add(A), Z.set(e, r), w.set(e, A), z||(z=e, r.getElement().classList.add("settings-category-active"), A.getElement().classList.add("settings-tab-active"))
      }
      const a=D.get(A.settingMagicRendererId);
      a?r.add(a(A)):c.push(A)
    }
    )), I(h.b, (A=>V((0, P.Db)(`setting.boolean.$ {
      A.getSaveId()
    }
    `)).linkSetting(A))), I(u.N, (A=>function (A) {
      const t=document.createElement("div"), e=document.createElement("select");
      return e.classList.add("single-select"), t.appendChild(e), t.appendChild(document.createTextNode(A)), new d(t, e)
    }
    ((0, P.Db)(`setting.select.$ {
      A.getSaveId()
    }
    `)).linkSetting(A))), I(m.E, (A=>(0, l.Hh)((0, P.Db)(`setting.string.$ {
      A.getSaveId()
    }
    .placeholder`), (0, P.Db)(`setting.string.$ {
      A.getSaveId()
    }
    `)).linkSetting(A))), I(B.a, (A=>(0, i.UY)().add((0, s.Pe)((0, P.Db)(`setting.select.$ {
      A.getSaveId()
    }
    `)).onClick((()=>C(A)))))), new MutationObserver((()=> {
      if (!z)return;
      const A=Z.get(z);
      if (!A||!A.getElement().checkVisibility())return;
      const t=parseFloat(getComputedStyle(A.getElement()).rowGap), e=A.getChildren().reduce(((A, e)=>A+e.getClientHeight()+t), 0), r=A.getChildren().reduce(((A, r)=>A>e/2?A:A+r.getClientHeight()+t), 0);
      A.getElement().style.maxHeight=`$ {
        r+5
      }
      px`
    }
    )).observe((0, f.XA)("SettingsPanel").getElement(), {
      childList:!0, subtree:!0, attributes:!0, characterData:!0
    }
    )
  }
  , 4856:(A, t, e)=> {
    "use strict";
    e.d(t, {
      a:()=>s
    }
    );
    var r=e(7315), i=e(2447);
    class s extends i.B {
      static init(A, t=0) {
        return new s(A, t)
      }
      constructor(A, t=0) {
        super( {
        }
        , A, t), this.type="multi-select", this.initialized=!0, this.initialEnabled=null
      }
      option(A, t, e, i) {
        if (A.includes(","))throw new r.Qn("Key cannot contain ','");
        return this.value[A]= {
          value:t, label:e, status:this.initialEnabled?this.initialEnabled.includes(A):i
        }
        , this.registry.broadcast(this.value), this
      }
      isSelected(A) {
        return !!this.value[A]&&this.value[A].status
      }
      select(A, t) {
        if (!this.value[A])throw new r.Qn(`Option with key $ {
          A
        }
        does not exist`);
        return this.value[A].status=t, this.registry.broadcast(this.value), this
      }
      getEnabledOptions() {
        return Object.keys(this.value).filter((A=>this.value[A].status)).map((A=>this.value[A].value))
      }
      getAllOptions() {
        return Object.keys(this.value).map((A=>this.value[A].value))
      }
      toString() {
        return Object.keys(this.value).filter((A=>this.value[A].status)).join(",")
      }
      fromString(A) {
        const t=A.split(",");
        for (const A in this.value)this.value[A].status=t.includes(A);
        return this.initialEnabled=t, this
      }
    }
  }
  , 3590:(A, t, e)=> {
    "use strict";
    e.d(t, {
      S:()=>h, v:()=>d
    }
    );
    var r=e(7315), i=e(3808), s=e(2447);
    class a extends s.B {
      constructor() {
        super(...arguments), this.type="number", this.initialized=!0
      }
      toString() {
        return this.value.toString()
      }
      fromString(A) {
        this.value=parseFloat(A)
      }
    }
    class n extends s.B {
      constructor() {
        super(...arguments), this.type="integer", this.initialized=!0
      }
      toString() {
        return this.value.toString()
      }
      fromString(A) {
        this.value=parseInt(A)
      }
    }
    var o=e(4231), q=e(504);
    class V extends q.I {
      constructor() {
        super(...arguments), this.cache=[]
      }
      broadcast(...A) {
        super.broadcast(...A), this.cache.push(A)
      }
      register(A) {
        super.register(A);
        for (const t of this.cache)A(...t)
      }
    }
    const d=new V;
    class h {
      constructor(A) {
        this.prefix=A, this.registry= {
        }
      }
      static init(A) {
        if (A.includes("@")||A.includes("."))throw new r.Qn("Prefix cannot contain '@' or '.'");
        return new h(A)
      }
      register(A, t) {
        if (A.includes("."))throw new r.Qn("Key cannot contain '.'");
        return t.load(`$ {
          this.prefix
        }
        @$ {
          A
        }
        `), d.broadcast(t), this.registry[A]=t, this
      }
      registerString(A, t, e, r=0) {
        return this.register(A, new i.E(t, e, r))
      }
      registerNumber(A, t, e, r=0) {
        return this.register(A, new a(t, e, r))
      }
      registerInteger(A, t, e, r=0) {
        return this.register(A, new n(t, e, r))
      }
      registerBoolean(A, t, e, r=0) {
        return this.register(A, new o.b(t, e, r))
      }
      get(A) {
        return this.registry[A]
      }
      getAll() {
        return this.registry
      }
    }
  }
  , 5439:(A, t, e)=> {
    "use strict";
    e.d(t, {
      N:()=>s
    }
    );
    var r=e(2447), i=e(161);
    class s extends r.B {
      constructor(A, t, e=0) {
        super( {
        }
        , t, e), this.type="single-select", this.options= {
        }
        , this.optionRegistry=new i.C(((A, t, e)=>A(t, e)), (A=>Object.entries(this.options).forEach((([t, e])=>A(t, e))))), this.selected=A
      }
      option(A, t, e) {
        return this.options[A]= {
          value:t, label:e
        }
        , this.optionRegistry.broadcast(A, this.options[A]), A===this.selected&&this.set(t), this
      }
      fillOptions(A) {
        for (const t in A)this.option(t, A[t], t)
      }
      registerOptionListener(A) {
        this.optionRegistry.register(A)
      }
      getOptionRegistry() {
        return this.optionRegistry
      }
      getSelectedOption() {
        return this.selected
      }
      select(A) {
        if (!this.options[A])throw new Error(`Option with key $ {
          A
        }
        does not exist`);
        return this.selected=A, this.set(this.options[A].value), this
      }
      toString() {
        return this.selected
      }
      fromString(A) {
        this.selected=A, this.options[A]&&(this.value=this.options[A].value, this.initialized=!0)
      }
    }
  }
  , 3808:(A, t, e)=> {
    "use strict";
    e.d(t, {
      E:()=>i
    }
    );
    var r=e(2447);
    class i extends r.B {
      constructor() {
        super(...arguments), this.type="string", this.initialized=!0, this.mutators=[], this.rules=[]
      }
      static asAddress(A, t, e=0) {
        const r=A=> {
          try {
            const t=new URL(A);
            return ["http:", "https:", "ws:", "wss:"].includes(t.protocol)&&("localhost"===t.hostname||t.hostname.includes("."))
          }
          catch(A) {
            return !1
          }
        }
        ;
        return new i(A, t, e).mutate((A=>A.trim().toLowerCase())).mutate((A=>!r(A)&&r(`https://$ {
          A
        }
        `)?`https://$ {
          A
        }
        `:A)).addRule("Invalid address", (A=>r(A)))
      }
      mutate(A) {
        return this.mutators.push(A), this
      }
      addRule(A, t) {
        return this.rules.push( {
          errorMessage:A, rule:t
        }
        ), this
      }
      getMutators() {
        return this.mutators
      }
      getRules() {
        return this.rules
      }
      toString() {
        return this.value
      }
      fromString(A) {
        this.value=A
      }
    }
  }
  , 9983:(A, t, e)=> {
    "use strict";
    e.d(t, {
      th:()=>n, PL:()=>q, Wr:()=>V, kV:()=>d
    }
    );
    var r=e(3590), i=e(4856), s=e(5439), a=e(3808);
    const n= {
      name:"Advanced"
    }
    , o=r.S.init("wf").register("theme", new s.N("pastel", {
      name:"General"
    }
    )).registerString("player-name", "Unknown Player", null).registerBoolean("hud-clock", !0, {
      name:"Game Interface"
    }
    ).register("game-server", a.E.asAddress("https://warfront.io", n)).register("debug-renderer", i.a.init(n));
    function q(A) {
      return o.get(A).get()
    }
    function V(A) {
      return o.get(A)
    }
    function d(A, t) {
      o.get(A).registerListener(t)
    }
  }
}
, t= {
}
;
function e(r) {
  var i=t[r];
  if (void 0!==i)return i.exports;
  var s=t[r]= {
    exports: {
    }
  }
  ;
  return A[r](s, s.exports, e), s.exports
}
e.d=(A, t)=> {
  for (var r in t)e.o(t, r)&&!e.o(A, r)&&Object.defineProperty(A, r, {
    enumerable:!0, get:t[r]
  }
  )
}
, e.o=(A, t)=>Object.prototype.hasOwnProperty.call(A, t), e.r=A=> {
  "undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(A, Symbol.toStringTag, {
    value:"Module"
  }
  ), Object.defineProperty(A, "__esModule", {
    value:!0
  }
  )
}
, window.addEventListener("load", (()=> {
  e(6232), e(7032), e(9116), e(3272), e(385), e(7726), e(9676), e(3544), e(7233), e(1883), e(8234), e(6877), e(4572), e(4146), e(4479), e(4025), e(253), e(8518), e(3977), e(1291), e(1716), e(9572), e(9646), e(596), e(4756)
}
)), 4231:(A, t, e)=> {
  "use strict";
  e.d(t, {
    b:()=>i
  }
  );
  var r=e(2447);
  class i extends r.B {
    constructor() {
      super(...arguments), this.type="boolean", this.initialized=!0
    }
    toString() {
      return this.value.toString()
    }
    fromString(A) {
      this.value="true"===A
    }
  }
}
, 2447:(A, t, e)=> {
  "use strict";
  e.d(t, {
    B:()=>s
  }
  );
  var r=e(7315), i=e(161);
  class s {
    constructor(A, t=null, e=0) {
      this.initialized=!1, this.registry=new i.C(((A, t)=>A(null!=t?t:this.value, this)), (A=>this.initialized&&A(this.value, this))), this.updaters= {
      }
      , this.defaultValue=A, this.value=A, this.category=t, this.version=e
    }
    get() {
      if (!this.initialized)throw new r.j4("Setting has not been initialized");
      return this.value
    }
    set(A) {
      return this.registry.broadcast(A), this.value=A, this.initialized=!0, this
    }
    isInitialized() {
      return this.initialized
    }
    getDefaultValue() {
      return this.defaultValue
    }
    getVersion() {
      return this.version
    }
    getCategory() {
      return this.category
    }
    registerListener(A) {
      this.registry.register(A)
    }
    getRegistry() {
      return this.registry
    }
    registerUpdater(A, t) {
      this.updaters[A]=t
    }
    parse(A, t) {
      this.fromString(this.applyUpdaters(A, t)), this.save(), this.initialized&&this.registry.broadcast(this.value)
    }
    applyUpdaters(A, t) {
      for (;
      t<this.version;
      ) {
        const e=this.updaters[t];
        if (!e)throw new r.JS(`No updater found for setting $ {
          this.saveId
        }
        from version $ {
          t
        }
        `);
        A=e(A), t++
      }
      return A
    }
    getSaveId() {
      return this.saveId
    }
    load(A) {
      this.saveId=A;
      const t=localStorage.getItem(this.saveId);
      if (t&&t.match(/^.*:\d+$/))try {
        const A=t.match(/^(.*):(\d+)$/);
        A?this.parse(A[1], parseInt(A[2])):console.warn(`Failed to load setting $ {
          this.saveId
        }
        : Invalid format`)
      }
      catch(A) {
        console.error(`Failed to decode setting $ {
          this.saveId
        }
        :`, A)
      }
    }
    save(A=this.saveId) {
      localStorage.setItem(A, `$ {
        this.toString()
      }
      :$ {
        this.getVersion()
      }
      `)
    }
  }
}
}
;