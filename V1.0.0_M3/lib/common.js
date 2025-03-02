var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "load": function () {

  },
  "action": {
    "storage": function (changes, namespace) {
      if (namespace !== "local") return;
      if (changes.darkMode) {
        if (changes.darkMode.newValue) {
          app.action.set.icon({
            64: "data/icons/64-dark.png"
          });
        }else{
          app.action.set.icon({
            32: "data/icons/32.png",
            64: "data/icons/64.png",
            128: "data/icons/128.png"
          });
        }
      }
    },
    "removed": {
      "tab": function (tabId) {
        if (config.audioStates[tabId]) {
          delete config.audioStates[tabId];
          config.interface.audioStates = config.audioStates;
        }
      },
      "window": function (windowId) {
        const myObject = config.interface.audioStates;
        for (const key in myObject) {
          if (myObject.hasOwnProperty(key)) {
            if (myObject[key]) {
              if (myObject[key].interface) {
                if (myObject[key].interface.id) {
                  if (myObject[key].interface.id == windowId) {
                    delete config.audioStates[key];
                    config.interface.audioStates = config.audioStates;
                  }
                }
              }
            }
          }
        }
      }
    },
    "create": function(tabID) {
        const url = app.interface.path+"?tabID="+tabID;
        app.interface.create(url, 343, 400, (id, top, left)=>{
          config.audioStates[tabID] = {"interface": {"id": id, "top": top, "left": left}}
          config.interface.audioStates = config.audioStates;
        });
    },
    "button": function () {
      app.tab.query.id((tabID)=>{
        if (Object.hasOwn(config.interface.audioStates, tabID)){
          audioStates = config.interface.audioStates[tabID];
          if (audioStates) {
            if (audioStates.interface) {
              app.window.get(audioStates.interface.id,(win)=>{
                if (win == null) {
                  core.action.create(tabID);
                }else{
                  app.window.update(audioStates.interface.id, {
                      focused: true, 
                      left: audioStates.interface.left || 700, 
                      top: audioStates.interface.top || 300
                    });
                }
              })
            }else{
              core.action.create(tabID);
            }
          }else{
            core.action.create(tabID);
          }
        }else{
          core.action.create(tabID);
        }
      });

    }
  }
};

app.button.on.clicked(core.action.button);
app.on.storage(core.action.storage);
app.tab.on.removed(core.action.removed.tab);
app.window.on.removed(core.action.removed.window);
app.contextmenu.on.clicked(core.action.contextmenu);

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);
