/** * MapRenderer & Territory Background Renderers * WarFront.io System Module */ export const SystemModule_MapRenderer = {
  253:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      mapRenderer:()=>g
    }
    );
    var r=e(5510), i=e(6827), s=e(8753), a=e(9983), n=e(7510), o=e(8621), q=e(9676);
    class V extends i.E {
      setup(A) {
        super.setup(A), this.program=A.requireProgram(n.Pv, n.sw, "Map renderer failed to init"), this.vao=A.createVertexArray(this.program, r.p.positionAttribute()), this.uniforms=A.loadUniforms(this.program, "texture_data", "palette_data")
      }
      init(A) {
        super.init(A), this.resizeCanvas(o.hf.width, o.hf.height), this.forceRepaint((0, a.PL)("theme"))
      }
      forceRepaint(A) {
        this.initDetails(A), this.context.bind(this.program, this.vao, this.framebuffer), this.context.viewport(o.hf.width, o.hf.height);
        const t=this.createPalette(A), e=this.context.createTexture(o.hf.width, o.hf.height, o.hf.tiles, {
          type:WebGL2RenderingContext.UNSIGNED_SHORT, internalFormat:WebGL2RenderingContext.R16UI, format:WebGL2RenderingContext.RED_INTEGER
        }
        ), r=this.context.createTexture(o.hf.width, o.hf.height, o.hf.distanceMap, {
          type:WebGL2RenderingContext.SHORT, internalFormat:WebGL2RenderingContext.R16I, format:WebGL2RenderingContext.RED_INTEGER
        }
        );
        this.context.bindTexture(r, 2), this.context.bindTexture(t, 1), this.context.bindTexture(e, 0), this.uniforms.set1i("palette_data", 1), this.uniforms.set1i("texture_data", 0), this.context.drawTriangles(2), this.details.forEach((A=>A())), this.context.deleteTexture(t), this.context.deleteTexture(e), this.context.resetFramebuffer(), this.context.viewport()
      }
      createPalette(A) {
        const t=new Uint8Array(196608);
        for (const e of o.hf.tileTypes) {
          const r=A.getTileColor(e).toRGB();
          t[3*e.id]=r.r, t[3*e.id+1]=r.g, t[3*e.id+2]=r.b
        }
        return this.context.createTexture(256, 256, t)
      }
      onMapMove(A, t) {
        g.dx=A, g.dy=t
      }
      onMapScale(A) {
        g.scale=A
      }
      initDetails(A) {
        this.details=[];
        for (const t of A.getShaderArgs()) {
          const A=d[t.name];
          A?this.details.push(A(this.context, t.args)):console.warn(`Unknown detail shader $ {
            t.name
          }
          `)
        }
      }
    }
    const d= {
      "territory-outline":(A, t)=>h(A, t.color, -t.thickness, 0, 0), "territory-inline":(A, t)=>h(A, t.color, 0, t.thickness, 0), "territory-outline-smooth":(A, t)=>h(A, t.color, -t.thickness, 0, 1/t.thickness), "territory-inline-smooth":(A, t)=>h(A, t.color, 0, t.thickness, -1/t.thickness), "fixed-distance":(A, t)=>h(A, t.color, t.min, t.max, 0), "dynamic-distance":(A, t)=>h(A, t.color, t.min, t.max, t.gradient)
    }
    ;
    function h(A, t, e, i, s) {
      const a=A.requireProgram(n.Pv, n.Rs, "Map detail failed to init"), o=A.createVertexArray(a, r.p.positionAttribute()), q=A.loadUniforms(a, "dist_data", "min", "max", "gradient", "color"), V=t.toRGB();
      return ()=> {
        A.bind(a, o), q.set1i("dist_data", 2), q.set1i("min", e), q.set1i("max", i), q.set4f("color", V.r/255, V.g/255, V.b/255, V.a), q.set1f("gradient", s), A.drawTriangles(2)
      }
    }
    const g=new V;
    s.h.scale.register(g.onMapScale), s.h.move.register(g.onMapMove), q.renderingContextInit.register((A=>A===q.rendererContextGameplay&&q.gameRenderer.registerLayer(g, 5))), (0, a.kV)("theme", (A=>o.F4&&g.forceRepaint(A)))
  }
  , 3977:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      territoryRenderer:()=>l
    }
    );
    var r=e(6827), i=e(8753), s=e(8621), a=e(7798), n=e(3434);
    class o {
      constructor() {
        this.tiles=[], this.updates=[]
      }
      clearTiles(A) {
        for (const t of A)this.tiles.push(t), this.updates.push(a.Q.OWNER_NONE)
      }
      paintTiles(A, t) {
        for (const e of A)this.tiles.push(e), this.updates.push(t)
      }
      paintBorderTiles(A, t) {
        for (const e of A)this.tiles.push(e), this.updates.push(65536+t)
      }
      forceRepaint(A) {
        if (s.F4) {
          l.updatePalette(A);
          for (let A=0;
          A<s.hf.width*s.hf.height;
          A++) {
            const t=a.Q.getOwner(A);
            t!==a.Q.OWNER_NONE&&t!==a.Q.OWNER_NONE-1&&(this.tiles.push(A), this.updates.push(n.g.getBorderTiles(t).has(A)?65536+t:t))
          }
        }
      }
    }
    var q=e(9983), V=e(3344), d=e(1575), h=e(9676), g=e(5765), u=e(7510);
    class m extends r.E {
      constructor() {
        super(...arguments), this.manager=new o
      }
      setup(A) {
        super.setup(A), this.program=A.requireProgram(u.u_, u.w0, "Territory renderer failed to init"), this.tileBuffer=A.createBuffer(), this.updateBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", buffer:this.tileBuffer, size:1, type:WebGL2RenderingContext.UNSIGNED_INT, asInt:!0
        }
        , {
          name:"id", buffer:this.updateBuffer, size:1, type:WebGL2RenderingContext.UNSIGNED_INT, asInt:!0
        }
        ), this.uniforms=A.loadUniforms(this.program, "size", "palette_data"), this.updatePalette((0, q.PL)("theme"))
      }
      init(A) {
        super.init(A), this.resizeCanvas(s.hf.width, s.hf.height, !0)
      }
      updatePalette(A) {
        const t=new Uint8Array(524288);
        for (const e of g.b.getPlayers()) {
          const r=A.getTerritoryColor(e.baseColor).toRGB(), i=A.getBorderColor(e.baseColor).toRGB();
          t[4*e.id]=r.r, t[4*e.id+1]=r.g, t[4*e.id+2]=r.b, t[4*e.id+3]=255*r.a, t[262144+4*e.id]=i.r, t[262144+4*e.id+1]=i.g, t[262144+4*e.id+2]=i.b, t[262144+4*e.id+3]=255*i.a
        }
        this.palette=this.context.createTexture(256, 512, t, {
          internalFormat:WebGL2RenderingContext.RGBA, format:WebGL2RenderingContext.RGBA
        }
        )
      }
      render(A) {
        this.manager.tiles.length>0&&(this.context.bind(this.program, this.vao, this.framebuffer), this.context.stopBlend(), this.context.viewport(s.hf.width, s.hf.height), this.context.bindTexture(this.palette), this.uniforms.set2i("size", s.hf.width, s.hf.height), this.uniforms.set1i("palette_data", 0), this.context.bufferData(this.tileBuffer, new Uint32Array(this.manager.tiles), WebGL2RenderingContext.DYNAMIC_DRAW), this.context.bufferData(this.updateBuffer, new Uint32Array(this.manager.updates), WebGL2RenderingContext.DYNAMIC_DRAW), this.context.drawPoints(this.manager.tiles.length), this.context.startBlend(), this.context.viewport(), this.context.resetFramebuffer(), this.manager.tiles=[], this.manager.updates=[]), super.render(A)
      }
      onMapMove(A, t) {
        l.dx=A, l.dy=t
      }
      onMapScale(A) {
        l.scale=A
      }
    }
    const l=new m;
    i.h.scale.register(l.onMapScale), i.h.move.register(l.onMapMove), h.renderingContextInit.register((A=>A===h.rendererContextGameplay&&h.gameRenderer.registerLayer(l, 10))), (0, q.kV)("theme", l.manager.forceRepaint.bind(l.manager)), (0, V.dc)(d.r, (function () {
      this.attacker?(l.manager.paintTiles(this.borderData.territory, this.attacker.id), l.manager.paintBorderTiles(this.borderData.attacker, this.attacker.id)):l.manager.clearTiles(this.tiles), this.defendant&&l.manager.paintBorderTiles(this.borderData.defender, this.defendant.id)
    }
    ))
  }
  , 4479:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      TerrainDepthRenderer:()=>n
    }
    );
    var r=e(8621), i=e(9983), s=e(7510), a=e(1743);
    class n extends a.G {
      constructor() {
        super(...arguments), this.useCache=!0
      }
      setup(A) {
        this.program=A.requireProgram(s.u_, s.tx, "Name depth debug renderer failed to init"), this.positionBuffer=A.createBuffer(), this.depthBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:1, type:WebGL2RenderingContext.UNSIGNED_INT, buffer:this.positionBuffer, asInt:!0
        }
        , {
          name:"id", size:1, type:WebGL2RenderingContext.UNSIGNED_SHORT, buffer:this.depthBuffer, asInt:!0
        }
        ), this.uniforms=A.loadUniforms(this.program, "size", "palette_data", "length"), this.palette=A.createTexture(3, 1, new Uint8Array([0, 0, 0, 128, 0, 255, 0, 128, 0, 0, 255, 128, 255, 0, 255, 128]), {
          internalFormat:WebGL2RenderingContext.RGBA, format:WebGL2RenderingContext.RGBA, magFilter:WebGL2RenderingContext.LINEAR
        }
        )
      }
      init(A) {
        super.init(A);
        const t=new Uint32Array(r.hf.width*r.hf.height);
        for (let A=0;
        A<r.hf.width*r.hf.height;
        A++)t[A]=A;
        A.bufferData(this.positionBuffer, t, WebGL2RenderingContext.DYNAMIC_DRAW)
      }
      render(A) {
        A.bind(this.program, this.vao), A.bindTexture(this.palette), this.uniforms.set2i("size", r.hf.width, r.hf.height), this.uniforms.set1ui("length", 100), this.uniforms.set1i("palette_data", 0), A.bufferData(this.depthBuffer, Uint16Array.from(r.hf.distanceMap, (A=>Math.max(0, A+50))), WebGL2RenderingContext.DYNAMIC_DRAW), A.drawPoints(r.hf.width*r.hf.height)
      }
    }
    (0, i.Wr)("debug-renderer").option("terrain-depth", new n, "Terrain Depth", !1)
  }
  , 4025:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      TerrainInfluenceRenderer:()=>n
    }
    );
    var r=e(8621), i=e(9983), s=e(7510), a=e(1743);
    class n extends a.G {
      constructor(A, t) {
        super(), this.simplified=A, this.navigableOnly=t, this.useCache=!0
      }
      setup(A) {
        this.program=A.requireProgram(s.u_, s.tx, "Terrain influence debug renderer failed to init"), this.positionBuffer=A.createBuffer(), this.influenceBuffer=A.createBuffer(), this.vao=A.createVertexArray(this.program, {
          name:"pos", size:1, type:WebGL2RenderingContext.UNSIGNED_INT, buffer:this.positionBuffer, asInt:!0
        }
        , {
          name:"id", size:1, type:WebGL2RenderingContext.UNSIGNED_SHORT, buffer:this.influenceBuffer, asInt:!0
        }
        ), this.uniforms=A.loadUniforms(this.program, "size", "palette_data", "length"), this.palette=A.createTexture(3, 1, new Uint8Array([255, 0, 0, 128, 255, 255, 0, 128, 0, 255, 0, 128, 0, 255, 255, 128, 0, 0, 255, 128, 255, 0, 255, 128, 255, 0, 0, 128]), {
          internalFormat:WebGL2RenderingContext.RGBA, format:WebGL2RenderingContext.RGBA, magFilter:WebGL2RenderingContext.LINEAR
        }
        )
      }
      render(A) {
        A.bind(this.program, this.vao), A.bindTexture(this.palette);
        const t=[], e=[], i=[];
        for (let A=0;
        A<r.hf.width*r.hf.height;
        A++) {
          if (this.navigableOnly&&!r.hf.getTile(A).navigable)continue;
          const s=this.simplified?r.hf.areaMap[r.hf.tileInfluence[A]]:r.hf.tileInfluence[A];
          let a=i[s];
          a||(a=Math.floor(6*Math.random()*255), i[s]=a), t.push(A), e.push(a)
        }
        this.uniforms.set2i("size", r.hf.width, r.hf.height), this.uniforms.set1ui("length", 1530), this.uniforms.set1i("palette_data", 0), A.bufferData(this.positionBuffer, new Uint32Array(t), WebGL2RenderingContext.DYNAMIC_DRAW), A.bufferData(this.influenceBuffer, new Uint16Array(e), WebGL2RenderingContext.DYNAMIC_DRAW), A.drawPoints(r.hf.width*r.hf.height)
      }
    }
    (0, i.Wr)("debug-renderer").option("tile-influence-simplified", new n(!0, !1), "Terrain Influence", !1), (0, i.Wr)("debug-renderer").option("tile-influence", new n(!1, !1), "Terrain Influence (Detailed)", !1)
  }
}
;