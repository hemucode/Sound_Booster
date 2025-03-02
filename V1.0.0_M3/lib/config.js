var config = {};

config.audioStates = {};

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.interface = {
  set size (val) {app.storage.write("interface.size", val)},
  get size () {return app.storage.read("interface.size") !== undefined ? app.storage.read("interface.size") : config.interface.default.size},
  get audioStates () {return app.storage.read("audioStates") !== undefined ? app.storage.read("audioStates") : config.audioStates},
  set audioStates (val) {app.storage.write("audioStates", val)},
  "default": {
    "size": {
      "width": 343, 
      "height": 400
    }
  }
};

