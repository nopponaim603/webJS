/** * UnitRenderer (Boats, Troops, Names, Debug Overlays) * WarFront.io System Module */ export const SystemModule_UnitRenderer = {
  1883:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      boatRenderer:()=>V
    }
    );
    var r=e(5388), i=e(9676), s=e(1743), a=e(7510), n=e(2580), o=e(9983);
    class q extends s.G {
      setup(A) {
        this.program=A.requireProgram(a.GW, a.zY, "Boat renderer failed to init"), this.positionBuffer=A.createBuffer(), this.colorBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:2, type:WebGL2RenderingContext.FLOAT, buffer:this.positionBuffer
        }
        , {
          name:"color", size:4, type:WebGL2RenderingContext.UNSIGNED_BYTE, buffer:this.colorBuffer, normalized:!0
        }
        ), this.uniforms=A.loadUniforms(this.program, "offset", "size")
      }
      render(A) {
        A.bind(this.program, this.vao);
        const t=n.L.getMapX(0), e=n.L.getMapX(A.raw.canvas.width), i=n.L.getMapY(0), s=n.L.getMapY(A.raw.canvas.height), a=r.G.getBoats().filter((A=>A.getX()+2>t&&A.getX()-2<e&&A.getY()+2>i&&A.getY()-2<s)), q=new Float32Array(30*a.length), V=new Uint8Array(60*a.length);
        for (let A=0;
        A<a.length;
        A++) {
          const t=a[A].getPlayer(), e=(0, o.PL)("theme").getTerritoryColor(t.baseColor).toRGB(), r=(0, o.PL)("theme").getBorderColor(t.baseColor).withLightness(.2).toRGB();
          for (let t=0;
          t<15;
          t++)V[60*A+4*t]=t%3?r.r:e.r, V[60*A+4*t+1]=t%3?r.g:e.g, V[60*A+4*t+2]=t%3?r.b:e.b, V[60*A+4*t+3]=t%3?255*r.a:255*e.a;
          for (let t=0;
          t<4;
          t++)q[30*A+6*t+(t?-4:4)]=-3, q[30*A+6*t+(t?-3:5)]=t%2?1:-1, q[30*A+6*t+11]=t%2?1.2:-1.2;
          q[30*A+20]=q[30*A+26]=1.5;
          const i=a[A].getNextX()-a[A].getX(), s=a[A].getNextY()-a[A].getY(), n=Math.atan2(s, i), d=Math.cos(n), h=Math.sin(n);
          for (let t=0;
          t<15;
          t++) {
            const e=q[30*A+2*t];
            q[30*A+2*t]=a[A].getX()+d*q[30*A+2*t]-h*q[30*A+2*t+1], q[30*A+2*t+1]=a[A].getY()+h*e+d*q[30*A+2*t+1]
          }
        }
        const d=this.context.raw.canvas.width, h=this.context.raw.canvas.height;
        this.uniforms.set2f("offset", n.L.x/d, n.L.y/h), this.uniforms.set2f("size", n.L.zoom/d, n.L.zoom/h), A.bufferData(this.positionBuffer, q, WebGL2RenderingContext.STREAM_DRAW), A.bufferData(this.colorBuffer, V, WebGL2RenderingContext.STREAM_DRAW), A.drawTriangles(5*a.length)
      }
    }
    const V=new q;
    i.renderingContextInit.register((A=>A===i.rendererContextGameplay&&i.gameRenderer.registerLayer(V, 20)))
  }
  , 8518:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      nameRenderer:()=>d
    }
    );
    var r=e(9365), i=e(5765), s=e(9676), a=e(1743), n=e(7510), o=e(2580), q=e(3748);
    class V extends a.G {
      setup(A) {
        (0, n.Q7)(A).then((A=>this.font=A)).catch((()=> {
        }
        ))
      }
      render(A) {
        if (!this.font)return;
        const t=o.L.getMapX(0), e=o.L.getMapX(A.raw.canvas.width), s=o.L.getMapY(0), a=o.L.getMapY(A.raw.canvas.height), n=[];
        for (let A=0;
        A<r.kj.playerData.length;
        A++) {
          const V=i.b.getPlayer(A);
          if (V&&V.isAlive()) {
            const i=r.kj.playerData[A];
            if (i.size*o.L.zoom<1||i.nameX+i.size+1<t||i.nameX+1>e||i.nameY+i.size+1<s||i.nameY+1>a)continue;
            n.push( {
              string:V.name, x:i.nameX, y:i.nameY, size:i.size, baselineBottom:!0
            }
            ), n.push( {
              string:(0, q.L)(V.getTroops()), x:i.nameX, y:i.nameY+i.size/2, size:i.size
            }
            )
          }
        }
        this.font.drawText(n)
      }
    }
    const d=new V;
    s.renderingContextInit.register((A=>A===s.rendererContextGameplay&&s.gameRenderer.registerLayer(d, 15)))
  }
  , 8234:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      BoatBotWaypointDebugRenderer:()=>o
    }
    );
    var r=e(2580), i=e(8621), s=e(9983), a=e(7510), n=e(1743);
    class o extends n.G {
      constructor() {
        super(...arguments), this.useCache=!1
      }
      setup(A) {
        this.program=A.requireProgram(a.DM, a.pI, "Boat waypoint debug renderer failed to init"), this.positionBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:2, type:WebGL2RenderingContext.FLOAT, buffer:this.positionBuffer
        }
        ), this.uniforms=A.loadUniforms(this.program, "offset", "size", "color")
      }
      render(A) {
        A.bind(this.program, this.vao);
        let t=0;
        for (const [A, e]of i.hf.boatTargets)for (const A of e)t+=A.path.length-1;
        const e=new Float32Array(2*t);
        let s=0;
        for (const [A, t]of i.hf.boatTargets)for (const r of t)if (!(A>r.tile))for (let A=1;
        A<r.path.length;
        A++)e[s++]=r.path[A-1]%i.hf.width+.5, e[s++]=Math.floor(r.path[A-1]/i.hf.width)+.5, e[s++]=r.path[A]%i.hf.width+.5, e[s++]=Math.floor(r.path[A]/i.hf.width)+.5;
        const a=A.raw.canvas.width, n=A.raw.canvas.height;
        this.uniforms.set2f("offset", r.L.x/a, r.L.y/n), this.uniforms.set2f("size", r.L.zoom/a, r.L.zoom/n), this.uniforms.set4f("color", 1, 0, 0, .8), A.bufferData(this.positionBuffer, e, WebGL2RenderingContext.STATIC_DRAW), A.drawLines(t/2)
      }
    }
    (0, s.Wr)("debug-renderer").option("boat-bot-waypoints", new o, "Boat Bot Waypoints", !1)
  }
  , 6877:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      BoatMeshDebugRenderer:()=>o
    }
    );
    var r=e(4830), i=e(2580), s=e(9983), a=e(1743), n=e(7510);
    class o extends a.G {
      constructor() {
        super(...arguments), this.useCache=!1
      }
      setup(A) {
        this.program=A.requireProgram(n.DM, n.pI, "Boat mesh debug renderer failed to init"), this.positionBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:2, type:WebGL2RenderingContext.FLOAT, buffer:this.positionBuffer
        }
        ), this.uniforms=A.loadUniforms(this.program, "offset", "size", "color")
      }
      init(A) {
        super.init(A);
        let t=0;
        for (const A of r.ey.nodeIndex)for (const e of A)t+=e.edges.length;
        this.edgeCount=t/2;
        const e=new Float32Array(2*t);
        let i=0;
        for (const A of r.ey.nodeIndex)for (const t of A)for (const A of t.edges)A.node.x<t.x||A.node.x===t.x&&A.node.y<t.y||(e[i++]=t.x+.5, e[i++]=t.y+.5, e[i++]=A.node.x+.5, e[i++]=A.node.y+.5);
        A.bufferData(this.positionBuffer, e, WebGL2RenderingContext.STATIC_DRAW)
      }
      render(A) {
        A.bind(this.program, this.vao);
        const t=A.raw.canvas.width, e=A.raw.canvas.height;
        this.uniforms.set2f("offset", i.L.x/t, i.L.y/e), this.uniforms.set2f("size", i.L.zoom/t, i.L.zoom/e), this.uniforms.set4f("color", 1, 0, 0, .8), A.drawLines(this.edgeCount)
      }
    }
    (0, s.Wr)("debug-renderer").option("boat-navigation-mesh", new o, "Boat Navigation Mesh", !1)
  }
  , 4572:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      debugRenderer:()=>q
    }
    );
    var r=e(6827), i=e(8753), s=e(8621), a=e(9983), n=e(9676);
    class o extends r.E {
      constructor() {
        super(...arguments), this.mapLayers=[], this.liveLayers=[]
      }
      updateLayers(A) {
        this.mapLayers.length=0, this.liveLayers.length=0, this.context&&(A.forEach((A=>A.init(this.context))), this.context.bindFramebuffer(this.framebuffer), this.context.raw.clearBufferfv(WebGL2RenderingContext.COLOR, 0, [0, 0, 0, 0]), this.context.viewport(s.hf.width, s.hf.height));
        for (const t of A)t.useCache?(this.mapLayers.push(t), this.context&&t.render(this.context)):this.liveLayers.push(t);
        this.context&&(this.context.resetFramebuffer(), this.context.viewport())
      }
      render(A) {
        0!==this.mapLayers.length&&super.render(A), this.liveLayers.forEach((t=>t.render(A)))
      }
      init(A) {
        super.init(A), this.resizeCanvas(s.hf.width, s.hf.height, !0), this.mapLayers.forEach((t=>t.init(A))), this.liveLayers.forEach((t=>t.init(A))), A.bindFramebuffer(this.framebuffer), this.context.viewport(s.hf.width, s.hf.height), this.mapLayers.forEach((t=>t.render(A))), A.resetFramebuffer(), A.viewport()
      }
      onMapMove(A, t) {
        q.dx=A, q.dy=t
      }
      onMapScale(A) {
        q.scale=A
      }
    }
    const q=new o;
    i.h.scale.register(q.onMapScale), i.h.move.register(q.onMapMove), n.renderingContextInit.register((A=>A===n.rendererContextGameplay&&n.gameRenderer.registerLayer(q, 50))), (0, a.kV)("debug-renderer", ((A, t)=>q.updateLayers(t.getEnabledOptions())))
  }
  , 4146:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      NameDepthDebugRenderer:()=>q
    }
    );
    var r=e(9365), i=e(8621), s=e(2580), a=e(9983), n=e(1743), o=e(7510);
    class q extends n.G {
      constructor() {
        super(...arguments), this.useCache=!1
      }
      setup(A) {
        this.program=A.requireProgram(o.RT, o.tx, "Name depth debug renderer failed to init"), this.positionBuffer=A.createBuffer(), this.depthBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:1, type:WebGL2RenderingContext.UNSIGNED_INT, buffer:this.positionBuffer, asInt:!0
        }
        , {
          name:"id", size:1, type:WebGL2RenderingContext.UNSIGNED_BYTE, buffer:this.depthBuffer, asInt:!0
        }
        ), this.uniforms=A.loadUniforms(this.program, "width", "scale", "size", "offset", "palette_data", "length"), this.palette=A.createTexture(2, 1, new Uint8Array([0, 255, 0, 128, 255, 0, 0, 128]), {
          internalFormat:WebGL2RenderingContext.RGBA, format:WebGL2RenderingContext.RGBA, magFilter:WebGL2RenderingContext.LINEAR
        }
        )
      }
      render(A) {
        A.bind(this.program, this.vao), A.bindTexture(this.palette);
        const t=r.kj.getNameDepth(), e=s.L.getMapX(0), a=s.L.getMapX(A.raw.canvas.width), n=s.L.getMapY(0), o=s.L.getMapY(A.raw.canvas.height), q=[], V=[];
        for (let A=0;
        A<i.hf.width*i.hf.height;
        A++) {
          if (s.L.zoom<1||A%i.hf.width+1<e||A%i.hf.width>a||Math.floor(A/i.hf.width)+1<n||Math.floor(A/i.hf.width)>o)continue;
          const r=t[A];
          0!==r&&(q.push(A), V.push(r))
        }
        const d=A.raw.canvas.width, h=A.raw.canvas.height;
        this.uniforms.set1ui("width", i.hf.width), this.uniforms.set1f("scale", s.L.zoom), this.uniforms.set2f("offset", s.L.x/d, s.L.y/h), this.uniforms.set2f("size", s.L.zoom/d, s.L.zoom/h), this.uniforms.set1ui("length", 50), this.uniforms.set1i("palette_data", 0), A.bufferData(this.positionBuffer, new Uint32Array(q), WebGL2RenderingContext.DYNAMIC_DRAW), A.bufferData(this.depthBuffer, new Uint8Array(V), WebGL2RenderingContext.DYNAMIC_DRAW), A.drawPoints(q.length)
      }
    }
    (0, a.Wr)("debug-renderer").option("name-depth", new q, "Name Depth", !1)
  }
}
;