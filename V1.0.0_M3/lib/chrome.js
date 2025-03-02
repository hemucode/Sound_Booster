var app = {}, API = chrome || browser;
app.error = function () {
  return API.runtime.lastError;
};

app.button = {
  "on": {
    "clicked": function (callback) {
      API.action.onClicked.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  }
};
app.action = {
  "set":{
    "icon": function(callback) {
      API.action.setIcon({
        path: callback
      });
    }
  }
};
app.contextmenu = {
  "create": function (options, callback) {
    if (API.contextMenus) {
      API.contextMenus.create(options, function (e) {
        if (callback) callback(e);
      });
    }
  },
  "on": {
    "clicked": function (callback) {
      if (API.contextMenus) {
        API.contextMenus.onClicked.addListener(function (info, tab) {
          app.storage.load(function () {
            callback(info, tab);
          });
        });
      }
    }
  }
};

app.storage = {
  "local": {},
  "read": function (id) {
    return app.storage.local[id];
  },
  "update": function (callback) {
    if (app.session) app.session.load();
    /*  */
    API.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (callback) {
        callback("update");
      }
    });
  },
  "write": function (id, data, callback) {
    let tmp = {};
    tmp[id] = data;
    app.storage.local[id] = data;
    /*  */
    API.storage.local.set(tmp, function (e) {
      if (callback) {
        callback(e);
      }
    });
  },
  "load": function (callback) {
    const keys = Object.keys(app.storage.local);
    if (keys && keys.length) {
      if (callback) {
        callback("cache");
      }
    } else {
      app.storage.update(function () {
        if (callback) callback("disk");
      });
    }
  } 
};

app.window = {
  "create": function (options, callback) {
    API.windows.create(options, function (e) {
      if (callback) callback(e);
    });
  },
  "get": function (windowId, callback) {
    API.windows.get(windowId, function (e) {
      if (callback){
        if (API.runtime.lastError) {
          callback(null);
        }else{
          callback(e);
        }
      } 
    });
  },
  "update": function (windowId, options, callback) {
    API.windows.update(windowId, options, function (e) {
      if (callback) callback(e);
    });
  },
  "remove": function (windowId, callback) {
    API.windows.remove(windowId, function (e) {
      if (callback) callback(e);
    });
  },
  "query": {
    "current": function (callback) {
      API.windows.getCurrent(callback);
    }
  },
  "on": {
    "removed": function (callback) {
      API.windows.onRemoved.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  }
};


app.on = {
  "management": function (callback) {
    API.management.getSelf(callback);
  },
  "uninstalled": function (url) {
    API.runtime.setUninstallURL(url, function () {});
  },
  "installed": function (callback) {
    API.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    API.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "connect": function (callback) {
    API.runtime.onConnect.addListener(function (e) {
      app.storage.load(function () {
        if (callback) callback(e);
      });
    });
  },
  "storage": function (callback) {
    API.storage.onChanged.addListener(function (changes, namespace) {
      app.storage.update(function () {
        if (callback) {
          callback(changes, namespace);
        }
      });
    });
  },
  "message": function (callback) {
    API.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      app.storage.load(function () {
        callback(request, sender, sendResponse);
      });
      /*  */
      return true;
    });
  }
};

app.tab = {
  "get": function (tabId, callback) {
    API.tabs.get(tabId, function (e) {
      if (callback) callback(e);
    });
  },
  "remove": function (tabId, callback) {
    API.tabs.remove(tabId, function (e) {
      if (callback) callback(e);
    });
  },  
  "query": {
    "id": function (callback) {
      API.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        let tmp = API.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0].id);
        } else callback(undefined);
      });
    }
  },
  "update": function (tabId, options, callback) {
    if (tabId) {
      API.tabs.update(tabId, options, function (e) {
        if (callback) callback(e);
      });
    } else {
      API.tabs.update(options, function (e) {
        if (callback) callback(e);
      });
    }
  },
  "open": function (url, index, active, callback) {
    let properties = {
      "url": url, 
      "active": active !== undefined ? active : true
    };
    /*  */
    if (index !== undefined) {
      if (typeof index === "number") {
        properties.index = index + 1;
      }
    }
    /*  */
    API.tabs.create(properties, function (tab) {
      if (callback) callback(tab);
    }); 
  },
  "on": {
    "removed": function (callback) {
      API.tabs.onRemoved.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  }
};

app.interface = {
  "port": null,
  "message": {},
  "path": API.runtime.getURL("data/interface/popup.html"),
  "send": function (id, data) {
    if (id) {
      API.runtime.sendMessage({"data": data, "method": id, "path": "background-to-interface"});
    }
  },
  "post": function (id, data) {
    if (id) {
      if (app.interface.port) {
        app.interface.port.postMessage({"data": data, "method": id, "path": "background-to-interface"});
      }
    }
  },
  "close": function (context) {
    if (app.interface.id) {
      try {
        if (context === "popup") {/*  */}
        if (context === "tab") app.tab.remove(app.interface.id);
        if (context === "win") app.window.remove(app.interface.id);
      } catch (e) {}
    }
  },
  "create": function (url, width, height, callback) {
    app.window.query.current(function (win) {
      url = url ? url : app.interface.path;
      width = width ? width : config.interface.size.width;
      height = height ? height : config.interface.size.height;
      const top = config.interface.size.top || (win.top + Math.round((win.height - height) / 2));
      const left = config.interface.size.left || (win.left + Math.round((win.width - width) / 2));
      app.window.create({
        "url": url,
        "top": top,
        "left": left,
        "width": width,
        "type": "popup",
        "height": height
      }, function (e) {
        if (callback) callback(e.id, top, left);
      });
    });
  }
};

