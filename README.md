<h1>Pluto</h1>
A home automation framework
![Pluto](https://raw.githubusercontent.com/pahgawk/Pluto/master/public/images/pluto-small.png)

<h2>Structure</h2>
In `app.js`, new modules and sources are added like this:

```javascript
pluto.addSource(require("./plugins/example-source.js")(pluto));
pluto.addModule(require("./plugins/example-module.js")(pluto));
```

<h3>Sources</h3>
Sources listen for inputs and emit events when they happen.

A typical source module looks like this:
```javascript
module.exports = function(pluto) {
    var source = {};

    var data = {
      "counter": 0
    };

    //Load existing data
    pluto.getStorage("example-source", function(error, response) {
        if (response) data = response;
    });

    //Register a routing handler
    pluto.get("/", function(req, res) {
        data.counter++;

        //Display a response int the browser
        res.send("There have been " + data.counter + " visits");

        //Send an event for modules to listen for
        pluto.emitEvent("example-source::visit", data.counter);

        //Save data for the next time the server is restarted
        pluto.saveStorage("example-source", data, function(err) {
            if (err) throw err;
        });
    });

    return source;
};
```

<h3>Modules</h3>
Modules listen for events and do things when they are received.

A sample module:
```javascript
module.exports = function(pluto) {
    var module = {};

  //Register listeners as key-value pairs
    module.listeners = {
        "example-source::visit": function(visits) {
            console.log("Hello, visitor #" + visits + "!");
        }
    };

    return module;
}
```

<h2>Dependencies</h2>
Text-to-speech requires Festival to work. On linux, run:
```
apt-get install festival
```

On windows, download and install the binaries from http://downloads.sourceforge.net/e-guidedog/festival-2.1.1-win.7z specifically to the directory `C:\festival` and then add `C:\festival\bin` to your $PATH.
