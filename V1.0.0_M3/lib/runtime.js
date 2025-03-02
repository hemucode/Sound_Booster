app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};

// if (!navigator.webdriver) {
//   app.on.uninstalled(app.homepage() +"#uninstall");
//   app.on.installed(function (e) {
//     app.on.management(function (result) {
//       if (result.installType === "normal") {
//         app.tab.query.index(function (index) {
//           let previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
//           let doupdate = previous && parseInt((Date.now() - config.welcome.lastupdate) / (24 * 3600 * 1000)) > 45;
//           if (e.reason === "install" || (e.reason === "update" && doupdate)) {
//             let url = app.homepage();
//             app.tab.open(url, index, e.reason === "install");
//             config.welcome.lastupdate = Date.now();
//           }
//         });
//       }
//     });
//   });
// }

