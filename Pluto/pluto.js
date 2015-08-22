GLOBAL._ = require('underscore');
module.exports = function(config, tests) {
    config = config || {};

    var path = require('path');
    //var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var express = require("express");
    var exphbs = require('express-handlebars');
    var handlebars = require('handlebars');
    var multer  = require('multer');
    var sassMiddleware = require('node-sass-middleware');
    require('es6-promise').polyfill();
    var request = require('popsicle');
    require("shelljs/global");

    var pluto = {};

    pluto.app = express();

    var festival = false;
    if (which("festival")) {
        festival = true;
    }

    pluto.modules = [];
    pluto.schedules = [];
    pluto.storage = {};
    pluto.listeners = {};

    var hbs = exphbs.create({
        helpers: {
            button: function(verb, url, text, classes) {
                verb = verb.toUpperCase();
                text = handlebars.escapeExpression(text);
                text = text || url;
                console.log(classes);
                classes = classes || "";

                if (verb == "GET") {
                    if (classes) {
                        classes = " " + classes;
                    }
                    return new handlebars.SafeString(
                        '<a class="button' + classes + '" href="' + url + '">' + text + '</a>'
                    );
                } else {
                    return new handlebars.SafeString(
                        '<form class="button_container" action="' + url + '" method="' + verb + '">' +
                            '<button type="submit" class="' + classes + '">' +
                                text +
                            '</button>' +
                        '</form>'
                    );
                }
            },
            button_disabled: function(text, classes) {
                classes = classes || "";
                return new handlebars.SafeString(
                    '<button disabled class="' + classes + '">' + text + '</button>'
                )
            }
        },
        defaultLayout: 'main',
        extname: ".html",
        layoutsDir: path.join(__dirname, "../views/layouts"),
        partialsDir: path.join(__dirname, "../views/partials")
    })

    pluto.router = express.Router();
    pluto.app.set('views', path.join(__dirname, "../views"))
    pluto.app.engine('.html', hbs.engine);
    pluto.app.set('view engine', 'handlebars');


    //Map requests to router
    pluto.get = function() {
        pluto.router.get.apply(pluto.router, arguments);
    };
    pluto.post = function() {
        pluto.router.post.apply(pluto.router, arguments);
    };
    pluto.delete = function() {
        pluto.router.delete.apply(pluto.router, arguments);
    };
    pluto.put = function() {
        pluto.router.put.apply(pluto.router, arguments);
    };


    pluto.getId = function(req, res) {
        if (config.id == "TEST") {
            return config.getId(req, res);
        } else if (config.id == "IP") {
            return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        } else { //Default: COOKIE
            if (req.cookies.plutoId) {
                return req.cookies.plutoId;
            } else {
                var id = makeId(20);
                res.cookie('plutoId', id, { maxAge: 9000000000, httpOnly: true });
                return id;
            }
        }
    };

    var makeId = function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };

    pluto.request = function(url, callback) {
        if (config.testRequests && config.testRequests[url]) {
            callback({
                body: config.testRequests[url]
            });
        } else {
            request(url).then(callback);
        }
    };

    //Text-to-speech
    pluto.say = function(text) {
        if (festival) {
            exec("echo " + text.replace("\"", "\\\"") + " | festival --tts");
        }
        console.log("Pluto says: " + text);
    };

    String.prototype.shellEscape = function() {
        return (this + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    }

    pluto.addListener = function(event, callback) {
        if (!pluto.listeners[event]) {
            pluto.listeners[event] = [];
        }
        pluto.listeners[event].push(callback);
    };

    pluto.removeListener = function(event, callback) {
        if (pluto.listeners[event]) {

            //Remove listener from array
            pluto.listeners[event] = pluto.listeners[event].filter(function(element) {
                return (element != callback);
            });
        }
    };

    pluto.emitEvent = function(event, data) {
        var args = arguments;
        if (pluto.listeners[event]) {
            pluto.listeners[event].forEach(function(listener) {
                if (listener) listener.apply(this, Array.prototype.slice.call(args, 1));
            });
        }
    };

    pluto.schedule = function(hours, callback) {
        callback();
        pluto.schedules.push(setInterval(callback, hours*60*60*1000));
    };

    pluto.getStorage = function(filename) {
        if (!pluto.storage[filename]) {
            if (config.testData) {
                if (config.testData[filename]) {
                    pluto.storage[filename] = config.testData[filename];
                } else {
                    pluto.storage[filename] = {};
                }
            } else {
                var file = "./storage/"+filename+".json";
                if (fs.existsSync(file)) {
                    var content = fs.readFileSync(file, "utf-8");
                    if (content) {
                        pluto.storage[filename] = JSON.parse(content);
                    } else {
                        pluto.storage[filename] = {};
                    }
                } else {
                    pluto.storage[filename] = {};
                }
            }
        }
        return pluto.storage[filename];
    };

    pluto.saveStorage = function(filename, callback) {
        if (config.testData) return;
        if (!callback) callback = function() {}; //noop
        if (pluto.storage[filename]) fs.writeFile("./storage/"+filename+".json", JSON.stringify(pluto.storage[filename]), callback);
    };


    pluto.addModule = function(module) {
        pluto.modules.push(module);
        if (module.listeners) {
            for (var event in module.listeners) {
                addListener(event, module.listeners[event]);
            }
        }
    };

    pluto.removeModule = function(module) {
        if (module.pluto.listeners) {
            for (var event in module.pluto.listeners) {
                removeListener(event, module.pluto.listeners[event]);
            }
        }
        pluto.modules = pluto.modules.map(function(element) {
            return (element != module);
        });
    };



    //This function should be called AFTER adding sources so that other listeners
    //take precedence over the error listeners
    pluto.listen = function(port) {
        //pluto.router.use(favicon(__dirname + '/public/favicon.ico'));
        pluto.app.use(logger('dev'));
        pluto.app.use(bodyParser.json());
        pluto.app.use(bodyParser.urlencoded({ extended: false }));
        pluto.app.use(cookieParser());
        pluto.app.use(
            sassMiddleware({
                src: path.join(__dirname, '../sass'),
                dest: path.join(__dirname, '../public/stylesheets'),
                prefix:  '/stylesheets',
                debug: true,
            })
        );
        pluto.app.use(express.static(path.join(__dirname, '../public')));
        pluto.app.use(multer({
            dest: path.join(__dirname, '../public/uploads'),
            rename: function (fieldname, filename) {
                return filename+Date.now();
            },
            onFileUploadStart: function (file) {
                console.log(file.originalname + ' is starting ...')
            },
            onFileUploadComplete: function (file) {
                console.log(file.fieldname + ' uploaded to  ' + file.path)
            }
        }));

        // catch 404 and forward to error handler
        pluto.router.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        pluto.router.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.send("error: " + err.message);
        });

        pluto.app.use("/", pluto.router);
        if (port) pluto.app.listen(port);

    };


    return pluto;
};
