#Pluto [![Build Status](https://travis-ci.org/davepagurek/Pluto.svg?branch=master)](https://travis-ci.org/pahgawk/Pluto)

![Pluto](https://raw.githubusercontent.com/pahgawk/Pluto/a826a991dda8d84eaa80be1155b0f0f6b685e851/public/images/pluto-small.png)

A home automation framework

<h2>Contributing</h2>
Create <a href="https://github.com/pahgawk/Pluto/issues">issues</a> for feature requests or bugs.

<h3>Adding features</h3>
- Make your feature in a new branch `git checkout -b my-feature-branch`
- Add <a href="#testing">unit tests</a> for testable features
- Push the branch `git push origin my-feature-branch`
- Make a pull request from the GitHub site
- Ask someone to make sure your changes don't break anything existing before merging
- Wait for the tests to run before merging

<h3>Pulling changes from master</h3>
Things are moving fast, so if you need changes from master that were added after you branched off, do this:
- Commit your changes
- Update master `git fetch origin`
- Rebase your feature branch from master `git rebase origin/master`
- Force push your changes onto your branch `git push origin +my-feature-branch`

<h2>Structure</h2>
In `app.js`, start Pluto like this:
```javascript
var pluto = require("./Pluto/pluto.js")({
    "id": "IP"
});

//Add modules here

pluto.listen(process.env.PORT || 3000);
```
IDs for users can be generated by `IP` to use their unique IP on the local network, `COOKIE` to generate a random string and store it in a cookie, and `TEST` to specify your own function to get the ip for a user given a request (see the Testing section for more details).

New modules are added like this:

```javascript
pluto.addModule(require("./plugins/example-module.js")(pluto));
```

Modules tend to fall into two categories, <strong>sources</strong> and <strong>responders</strong>.

<h3>Modules</h3>
Modules can interact with the system in a few ways:
- Respond to HTTP endpoints
- Emit events
- Listen and respond to events
- Schedule tasks
- Save storage

A typical module looks like this:
```javascript
module.exports = function(pluto) {
    var module = {};

    //Load existing data
    var data = pluto.getStorage("example-module");
    if (!data.counter) {
        data.counter = 0;
        pluto.saveStorage("example-module");
    }

    //Register a routing handler
    pluto.get("/", function(req, res) {
        data.counter++;

        //Display a response in the browser
        res.send("There have been " + data.counter + " visits");

        //Send an event for modules to listen for
        pluto.emitEvent("example-source::visit", data.counter);

        //Save data for the next time the server is restarted
        pluto.saveStorage("example-source");
    });
    
    //Register listeners
    pluto.addListener("example-source::visit", function(visits) {
        console.log("Hello, visitor #" + visits + "!");
    };

    return module;
};
```

<h4>Pluto functions for modules</h4>
- Respond to HTTP requests with `pluto.get(endpoint, function(req, res){ })`, `pluto.post(endpoint, function(req, res){ })`, or other HTTP verbs. The callback is a regular Express callback.
- Emit an event with `pluto.emitEvent("module::eventname", data[, data2, data3...])`
- Listen for and respond to events with `pluto.addListener("module::eventname", function(data[, data2, data3...]){ })`. Remove listeners with `pluto.removeListener("module::eventname", callback)`
- Say words out loud with `pluto.say(text)`
- Get storage with `pluto.getStorage(storagename)`. This returns a reference to an object, so editing the object edits it for _all modules_.
  - Do not reassign the storage to another object as the reference will then be different. Instead, only assign to its properties.
  - Save the storage to disk with `pluto.saveStorage(storagename)`
- Set a task to run immediately and then repeatedly on a schedule with `pluto.schedule(hours, callback)`
- To GET an external resource, use `pluto.request(url, function(response){ })`
  - Check `response.status` to make sure you got an HTTP 200.
  - Response data is in `response.body`. Resources that responded with `content-type: application/json` will be automatically parsed into an object, otherwise a string is returned.

<h4>Pluto helpers for views</h4>
- Unless `layout: false` is set when rendering, views are rendered inside the default Pluto layout. You can add the following properties to the object passed in:
  - Set the page title with `title: "Page Title"`
  - Set scripts to include after page content with `scripts: ["/javascripts/script1.js", "/javascripts/script2.js"]`
- Automatically render buttons with `{{button verb text classes}}`. Clicking the button will navigate to the page URL with the given verb, e.g. `{{button "POST" "Pause Music" ""}}`
- To make a disabled button, do `{{button_disabled text classes}}`
- To make a button that doesn't reload the page and instead just sends an AJAX request, do `{{button_ajax verb text classes}}`
- To automatically replace the contents of an element with AJAX-fetched content every _n_ seconds, use `<div id="replace_container"></div> {{auto_update "replace_container" "/something/replacement" 5}}`

<h2>Testing</h2>
Pluto can be initialized to use test storage instead of real user storage:
```javascript
var pluto = require("../Pluto/pluto.js")({
    testData: {
        users: {
            "Leslie": {},
            "Ron": {},
            "April": {},
            "Andy": {},
            "Donna": {},
            "Tom": {},
            "Ben": {}
        }
    }
});

```

Pluto can use test IDs for users by specifying a function to be called when an ID is requested:
```javascript
var pluto = require("../Pluto/pluto.js")({
    id: "TEST",
    getId: function(req, res) {
        //Assume the user making the request always has the ID "test"
        return "test";
    }
});
```

Requests made using `pluto.request` can be spoofed:
```javascript
var pluto = require("../Pluto/pluto.js")({
    testRequests: {
        "https://api.spotify.com/v1/search?q=Slim%20Shady&type=track": {
            body: {
                tracks: [ ... ]
            },
            status: 200
        }
    },
});
```

Use supertest to test HTTP endpoints:
```javascript
var request = require('supertest');
it("should sign in a user who is out when they GET /users/io", function(done) {
    request(pluto.app)
    .get("/users/io")
    .expect(200)
    .end(function(err, res) {
        if (err) return done(err);
        assert.equal(pluto.getStorage("users")["test"].in, true)
        done()
    });
});
```


Tests can be run with: `npm test`


<h2>Dependencies</h2>
Text-to-speech requires Festival to work. On linux, run:
```
apt-get install festival
```
MPlayer to play song links. Run:
```
apt-get install mplayer2
```

On windows, download and install the binaries from http://downloads.sourceforge.net/e-guidedog/festival-2.1.1-win.7z specifically to the directory `C:\festival` and then add `C:\festival\bin` to your $PATH.
