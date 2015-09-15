var container = document.getElementById("songs");
var state = {
    type: "artists",
    id: null
};

var makeHeader = function(headings) {
    var header = document.createElement("tr");
    headings.forEach(function(heading) {
        var headingElement = document.createElement("th");
        headingElement.innerHTML = heading;
        header.appendChild(headingElement);
    });
    return header;
};

var makeEmptyRow = function(length) {
    var rowElement = document.createElement("tr");
    var cell = document.createElement("td");
    cell.colspan = length;
    cell.innerHTML = "Nothing yet!";
    cell.className = "empty";
    rowElement.appendChild(cell);
    return rowElement;
};

var makeReturnButton = function(prevState, url) {
    var backButton = document.createElement("input");
    backButton.type = "button";
    backButton.value = "Back";
    backButton.addEventListener("click", function() {
        state = prevState;
        renderSongs(url);
    });
    return backButton;
};

var makeRow = function(row) {
    var rowElement = document.createElement("tr");
    var rowForm = document.createElement("form");
    rowForm.action = row.action;
    rowForm.method = "POST";

    row.fields.forEach(function(field) {
        if (field.type == "hidden") {
            var hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = field.name;
            hidden.value = field.value;
            rowForm.appendChild(hidden);
        } else {
            var cell = document.createElement("td");
            var input = document.createElement("input");
            input.type = field.type;
            input.name = field.name;
            input.value = field.value;
            cell.appendChild(input);
            rowForm.appendChild(cell);
        }
    });

    if (row.actions) {
        var actions = document.createElement("td");

        if (row.actions.change) {
            var change = document.createElement("input");
            change.type = "submit";
            change.value = "Change";
            actions.appendChild(change);
        }
        if (row.actions.next) {
            var nextButton = document.createElement("input");
            nextButton.type = "button";
            nextButton.value = "Go";
            nextButton.addEventListener("click", function() {
                state = row.actions.next.state;
                renderSongs(row.actions.next.url);
            });
            actions.appendChild(nextButton);
        }
        if (row.actions.delete) {
            actions.appendChild(subFormButton(
                "POST",
                row.actions.delete,
                "Delete",
                "delete"
            ));
        }

        rowForm.appendChild(actions);
    }

    rowElement.appendChild(rowForm);
    return rowElement;
};


var makeForm = function(options) {
    var form = document.createElement("form");
    form.action = options.action;
    form.method = "POST";

    options.fields.forEach(function(field) {
        if (field.type == "hidden") {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = field.name;
            input.value = field.value;
            container.appendChild(input);
            form.appendChild(container);
        } else {
            var container = document.createElement("div");
            container.className = "value";

            var label = document.createElement("label");
            label.innerHTML = field.label;
            container.appendChild(label);

            var input = document.createElement("input");
            input.type = field.type;
            input.name = field.name;
            input.value = field.value;
            container.appendChild(input);
            form.appendChild(container);
        }
    });

    var create = document.createElement("input");
    create.type = "submit";
    create.value = "Create";
    form.appendChild(create);
    return form;
};

var renderSongs = function(url) {
    container.innerHTML = "Loading...";
    ajax("GET", url, function(err, response) {
        if (err) {
            container.innerHTML = "<div class='message'>" + err + "</div>";
            return;
        }
        container.innerHTML = "";
        var data = JSON.parse(response);

        var list = document.createElement("table");
        list.className = "songList";

        if (state.type == "artists") {
            list.appendChild(makeHeader([
                "Name",
                "Actions"
            ]));

            if (data.artists.length > 0) {
                data.artists.forEach(function(artist) {
                    list.appendChild(makeRow({
                        action: "/music/local/artist",
                        fields: [
                            {
                                type: "hidden",
                                name: "id",
                                value: artist.id
                            },
                            {
                                type: "text",
                                name: "name",
                                value: artist.name
                            }
                        ],
                        actions: {
                            delete: "/music/local/artist/" + artist.id + "/delete",
                            next: {
                                url: "/music/local/artist/" + artist.id,
                                state: {
                                    type: "artist",
                                    id: artist.id
                                }
                            },
                            change: true
                        }
                    }));
                });
            } else {
                list.appendChild(makeEmptyRow(3));
            }

            list.appendChild(makeForm({
                action: "/music/local/artist",
                fields: [
                    {
                        label: "Name",
                        type: "text",
                        name: "name",
                        value: ""
                    }
                ]
            }));
        } else if (state.type == "artist") {
            list.appendChild(makeReturnButton(
                {
                    type: "artists",
                    id: null
                },
                "/music/local/artists"
            ));

            list.appendChild(makeHeader([
                "Name",
                "Art",
                "Actions"
            ]));

            if (data.albums.length > 0) {
                data.albums.forEach(function(album) {
                    list.appendChild(makeRow({
                        action: "/music/local/album",
                        fields: [
                            {
                                type: "hidden",
                                name: "id",
                                value: album.id
                            },
                            {
                                type: "text",
                                name: "name",
                                value: album.name
                            },
                            {
                                type: "text",
                                name: "art",
                                value: album.art
                            }
                        ],
                        actions: {
                            delete: "/music/local/album/" + album.id + "/delete",
                            next: {
                                url: "/music/local/album/" + album.id,
                                state: "album"
                            },
                            change: true
                        }
                    }));
                });
            } else {
                list.appendChild(makeEmptyRow(4));
            }

            list.appendChild(makeForm({
                action: "/music/local/album",
                fields: [
                    {
                        type: "hidden",
                        name: "id",
                        value: state.id
                    },
                    {
                        label: "Name",
                        type: "text",
                        name: "name",
                        value: ""
                    },
                    {
                        label: "Art",
                        type: "text",
                        name: "art",
                        value: ""
                    }
                ]
            }));
        }
        container.appendChild(list);
    });
};

renderSongs("/music/local/artists");
