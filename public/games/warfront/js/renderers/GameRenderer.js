/** * GameRenderer Canvas WebGL/2D Master Pipeline * WarFront.io System Module */ export const SystemModule_GameRenderer = {
  9676:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      GameRenderer:()=>o, gameRenderer:()=>V, rendererContextGameplay:()=>q, renderingContextInit:()=>d
    }
    );
    var r=e(6359), i=e(1733), s=e(504), a=e(5510);
    class n {
      constructor() {
        this.array=[], this.priority=[]
      }
      add(A, t) {
        const e=this.priority.findIndex((A=>A>t));
        -1===e?(this.array.push(A), this.priority.push(t)):(this.array.splice(e, 0, A), this.priority.splice(e, 0, t))
      }
      clear() {
        this.array.length=0, this.priority.length=0
      }
      forEach(A) {
        this.array.forEach(A)
      }
    }
    class o {
      constructor() {
        this.layers=new n, this.canvas=document.createElement("canvas"), this.canvas.id="gameCanvas", this.canvas.style.position="absolute", this.canvas.style.left="0", this.canvas.style.top="0", this.canvas.style.zIndex="-1", this.context=new a.p(this.canvas.getContext("webgl2", {
          premultipliedAlpha:!1
        }
        )), this.context.startBlendNatural(), this.doRenderTick(), document.body.appendChild(this.canvas)
      }
      switchContext(A) {
        this.layers.clear(), d.broadcast(A, this.context)
      }
      registerLayer(A, t) {
        try {
          A.init(this.context), this.layers.add(A, t)
        }
        catch(A) {
          console.error(A)
        }
      }
      doRenderTick() {
        this.layers.forEach((A=> {
          A.render(this.context)
        }
        )), requestAnimationFrame((()=>this.doRenderTick()))
      }
      resize(A, t) {
        V.canvas.width=Math.ceil(A/window.devicePixelRatio), V.canvas.height=Math.ceil(t/window.devicePixelRatio), V.context.viewport()
      }
    }
    const q=1, V=new o, d=new s.I;
    r.X.register(V.resize), i.om.register((()=>V.switchContext(q)))
  }
  , 7233:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      backgroundLayer:()=>s
    }
    );
    var r=e(9983), i=e(9676);
    const s=new class {
      init(A) {
        this.context=A, this.updateTheme((0, r.PL)("theme"))
      }
      updateTheme(A) {
        if (!this.context)return;
        const t=A.getBackgroundColor().toRGB();
        this.context.raw.clearColor(t.r/255, t.g/255, t.b/255, t.a)
      }
      render(A) {
        A.raw.clear(A.raw.COLOR_BUFFER_BIT)
      }
    }
    ;
    (0, r.kV)("theme", s.updateTheme.bind(s)), i.renderingContextInit.register((A=>A===i.rendererContextGameplay&&i.gameRenderer.registerLayer(s, 0)))
  }
}
;