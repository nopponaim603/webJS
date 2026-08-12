/** * Bot AI Attack Strategies & Decision Triggers * WarFront.io System Module */ export const SystemModule_BotAI = {
  3272:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      SimpleAttackStrategy:()=>V
    }
    );
    var r=e(1961), i=e(3434), s=e(8621), a=e(7798), n=e(448), o=e(5765), q=e(1744);
    class V {
      constructor(A, t, e, r) {
        this.dropAttackChance=A, this.targetSmallChance=t, this.targetNonPlayerChance=e, this.densityChoiceChance=r
      }
      execute(A) {
        const t=this.getTarget(A);
        return null!==t&&((0, q.C)(A, t, 100), !0)
      }
      getTarget(A) {
        let t=[];
        for (const e of i.g.getBorderTiles(A.id))s.hf.onNeighbors(e, (e=> {
          const r=a.Q.getOwner(e);
          r===A.id||t.includes(r)||t.push(r)
        }
        ));
        if (t=t.filter((t=>s.ot.canAttack(A.id, t))), t.length<1)return null;
        if (t.includes(a.Q.OWNER_NONE))return a.Q.OWNER_NONE;
        if (n.y.nextInt(100)<this.dropAttackChance)return null;
        if (n.y.nextInt(100)<this.targetSmallChance) {
          const e=t.filter((t=>o.b.getPlayer(t).getTerritorySize()<.1*A.getTerritorySize()));
          e.length>0&&(t=e)
        }
        if (n.y.nextInt(100)<this.targetNonPlayerChance) {
          const A=t.filter((A=>o.b.isBot(A)));
          A.length>0&&(t=A)
        }
        if (n.y.nextInt(100)<this.densityChoiceChance) {
          let A=1/0, e=null;
          for (const r of t) {
            const t=o.b.getPlayer(r), i=t.getTroops()/t.getTerritorySize();
            i<A&&(A=i, e=r)
          }
          return e
        }
        return t[n.y.nextInt(t.length)]
      }
    }
    (0, r.UX)((A=>A.push(new V(5+n.y.nextInt(10), n.y.nextInt(100), n.y.nextInt(100), n.y.nextInt(20)))))
  }
  , 6232:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      BoatAttackStrategy:()=>q
    }
    );
    var r=e(1961), i=e(3434), s=e(448), a=e(8621), n=e(7798), o=e(5388);
    class q {
      execute(A) {
        if (0===A.waterTiles)return !1;
        if (s.y.nextInt(100)>=30)return !1;
        const t=Array.from(i.g.getBorderTiles(A.id)), e=t[s.y.nextInt(t.length)], r=a.hf.boatTargets.get(e);
        if (void 0===r)return !1;
        const q=r[s.y.nextInt(r.length)];
        return !!a.ot.canAttack(A.id, n.Q.getOwner(q.tile))&&(o.G.addBoatInternal(A, q.path, 100), !0)
      }
    }
    (0, r.UX)((A=>A.push(new q)))
  }
  , 7032:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      CooldownBotConstraints:()=>a
    }
    );
    var r=e(1961), i=e(6139), s=e(448);
    class a {
      constructor(A) {
        this.cooldown=A, this.lastAttack=-A
      }
      allowAttack() {
        return !(i.p.getTickCount()-this.lastAttack<this.cooldown||(this.lastAttack=i.p.getTickCount(), 0))
      }
    }
    (0, r.K7)((A=>A.push(new a(s.y.nextInt(20)))))
  }
  , 9116:(A, t, e)=> {
    "use strict";
    e.r(t), e.d(t, {
      IntervalBotTrigger:()=>n, RandomBotTrigger:()=>a
    }
    );
    var r=e(1961), i=e(448), s=e(6139);
    class a {
      constructor(A) {
        this.chance=A
      }
      trigger() {
        return i.y.nextInt(100)<this.chance
      }
    }
    class n {
      constructor(A, t=0) {
        this.interval=A, this.lastTrigger=t-A
      }
      trigger() {
        return !(s.p.getTickCount()-this.lastTrigger<this.interval||(this.lastTrigger=s.p.getTickCount(), 0))
      }
    }
    (0, r.FZ)((A=> {
      const t=i.y.nextInt(100);
      t<3?A.push(new n(5, i.y.nextInt(5))):t<10?A.push(new a(t)):A.push(new a(t%10), new n(t+10, i.y.nextInt(t)))
    }
    ))
  }
}
;