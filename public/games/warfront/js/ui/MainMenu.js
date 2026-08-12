/** * MainMenu Controller & Singleplayer Game Launcher * WarFront.io System Module */ export const SystemModule_MainMenu = {
  9572:(A, t, e)=> {
    "use strict";
    e.r(t);
    var r=e(5310), i=e(9983), s=e(9087), a=e(7859), n=e(3360), o=e(1896), q=e(654), V=e(3153), d=e(3889), h=e(3433), g=e(4598);
    (0, q.hk)("MainMenu");
    const u=window.document.getElementById("btnStartSingleplayer"), m=/^[a-zA-Z0-9\u00A0-\u00FF\u0100-\u024F\u1E00-\u1EFF\-_. ( {
      )
    }
    <>]*$/;
    (0, a.C_)("btnStartSingleplayer", (()=> {
      (0, o.S7)((0, V.t)("menu.map.select"), (0, h.UY)("grid", "grid-3col").setContent(...(0, r.QD)().map((A=>(0, d.Pe)(A[1].name).onClick((()=>(0, g.e)(A[0], s.o.FFA, 23452345, [ {
        name:(0, i.PL)("player-name")
      }
    ], 0, !0)))))))
  }
  )), g.w.register((()=> {
    (0, q.Rx)(), (0, q.S9)("MainMenu"), (0, d.Pl)("danger", (0, V.t)("game.load.fail"), "slow")
  }
  )), (0, a.C_)("linkImprint", (()=>(0, o.S7)("Site Notice"))), (0, a.C_)("linkPrivacy", (()=>(0, o.S7)("Privacy Policy"))), (0, n.lZ)("playerNameInput", "playerNameInputValidation").onInput(((A, t)=> {
    u.disabled=!t
  }
  )).mutate((A=>A.trim())).addRule("Name contains invalid characters.", (A=>m.test(A))).addRule("Name is too short (must be at least 3 characters).", (A=>A.length>=3)).addRule("Name is too long (32 characters maximum).", (A=>A.length<=32)).linkSetting((0, i.Wr)("player-name"), !1)
}
, 9646:(A, t, e)=> {
  "use strict";
  e.r(t), e.d(t, {
    openMultiplayerLobby:()=>h
  }
  );
  var r=e(9983), i=e(9945), s=e(2614), a=e(1896), n=e(3889), o=e(398), q=e(4686), V=e(7830);
  let d=null;
  function h() {
    d=new AbortController;
    let A=!1;
    (0, i.PO)((0, r.PL)("game-server"), d.signal).then((()=> {
      d=null
    }
    )).catch((()=> {
      (0, a.bb)(), A=!0
    }
    )), setTimeout((()=> {
      A||(0, a.S7)("Connecting to Multiplayer Lobby", (0, n.M$)("Connecting to server...")).setCloseHandler((()=> {
        d?(d.abort(), d=null):(0, i.CS)(), (0, a.bb)()
      }
      ))
    }
    ), 500)
  }
  V.A6.handle(s.V, (function () {
    (0, a.W5)((0, n.M$)(`Game starting in $ {
      this.time
    }
    seconds ($ {
      this.playerCount
    }
    player$ {
      this.playerCount>1?"s":""
    }
    )...`))
  }
  )), i.HM.register((A=> {
    switch (A) {
      case o.q.NO_ERROR:break;
      case o.q.SERVER_OUT_OF_DATE:(0, n.Pl)("secondary", "This third party server is out of date, ask the server administrator to update it");
      break;
      case o.q.OUT_OF_DATE:(0, n.Pl)("secondary", "Server is for a newer version of the game, reloading the page..."), setTimeout((()=> {
        (0, q.rr)().then((()=>window.location.reload())).catch((()=> {
        }
        ))
      }
      ), 5e3);
      break;
      case o.q.NO_GAME_SERVER:(0, n.Pl)("secondary", "No game server is available, please try again later");
      break;
      default:(0, n.Pl)("danger", "Connection to server lost")
    }
  }
  ))
}
, 4756:(A, t, e)=> {
  "use strict";
  e.r(t), e.d(t, {
    handlePath:()=>a
  }
  );
  var r=e(4686), i=e(654);
  const s= {
    auth:r.mn
  }
  ;
  function a() {
    const A=window.location.pathname.match(/\/([^/]+)/);
    if (null===A||void 0===A[1]||!(A[1]in s))return window.history.replaceState(null, "", "/"), void(0, i.S9)("MainMenu");
    try {
      const t=new URLSearchParams(window.location.search);
      s[A[1]](t, A.slice(2))
    }
    catch(A) {
      console.error(A), window.history.replaceState(null, "", "/"), (0, i.S9)("MainMenu")
    }
  }
  a()
}
}
;