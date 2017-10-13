'use strict';

let svg, width, height, tree, stratify, correction = 150, interval, hive;
window.onload = function () {
    form();
    svg = d3.select("svg");
    width = svg.attr("width");
    height = svg.attr("height");
    tree = d3.tree().size([height, width - correction]);
    stratify = d3.stratify()
        .id(function (d) {
            return d.id;
        })
        .parentId(function (d) {
            return d.parent;
        })
};

function diagonal(s, d) {
    let dy = d.y + correction;
    return `M ${s.y} ${s.x} C ${(s.y + dy) / 2} ${s.x}, ${(s.y + dy) / 2} ${d.x}, ${dy} ${d.x}`;
}


function mode(p, d) {
    var div = p.append("div");
    div.append("label").text("Mode");
    var select = div.append("select").attr("class", "mode");


    var data = ["SCHEDULE", "MANUAL", "OFF", 'BOOST'];
    var options = select.selectAll('option')
        .data(data).enter()
        .append('option')
        .text(function (d) {
            return d;
        });

    select.attr("class", "mode").on('change', function (value) {
        hive.setMode(function () {
            hive.update(update);
        }, d.data.id, d.data.type, this.value);
    });
}

function boost(p, d) {
    var select = p.append("select").attr("class", "boost-select");

    var data = ["30", "60", 'BOOST'];
    var options = select.selectAll('option')
        .data(data).enter()
        .append('option')
        .text(function (d) {
            return d;
        });

    select.attr("class", "float-left").property('value', 'BOOST');

    select.on('change', function (value) {
        hive.setMode(function () {
            hive.update(update);
        }, d.data.id, d.data.type, 'BOOST', 22, this.value);
        select.property('value', 'boost');
    });
}

let enter_types = {
    "hub": function (d) {
        this.append("div").attr("class", "name");
        this.append("div").attr("class", "float-left").text("Power");
        this.append("div").attr("class", "power");
    },
    "boilermodule": function (d) {
        this.append("div").attr("class", "name");
        this.append("div").attr("class", "float-left").text("Power");
        this.append("div").attr("class", "power");
    },
    "thermostatui": function (d) {
        this.append("div").attr("class", "name");
        this.append("div").attr("class", "float-left").text("Power");
        this.append("div").attr("class", "power");
        this.append("div").attr("class", "float-left").text("Battery");
        this.append("div").attr("class", "battery");
        this.append("div").attr("class", "float-left").text("Signal");
        this.append("div").attr("class", "signal");
    },
    "heating": function (d) {
        this.append("div").attr("class", "name");

        mode(this, d);

        this.append("div").attr("class", "float-left").text("Target");
        this.append("div").attr("class", "target");
        this.append("div").attr("class", "float-left").text("Temperature");
        this.append("div").attr("class", "temperature");

        var div = this.append("div").attr("class", "boost-container");
        boost(div, d);
        div.append("div").attr("class", "boost");
    },
    "hotwater": function (d) {
        this.append("div").attr("class", "name");

        mode(this, d);

        this.append("div").attr("class", "float-left").text("Status");
        this.append("p").attr("class", "status");
        var div = this.append("div").attr("class", "boost-container");
        boost(div, d);
        this.append("div").attr("class", "boost");
    }
};

function update(a) {

    if (a.length === 0) {
        svg.selectAll(".link").data(a).exit().remove();
        svg.selectAll(".node").data(a).exit().remove();
        return;
    }


    let descendants = tree(stratify(a)).descendants();

    let links = svg.selectAll(".link").data(descendants.slice(1));

    links.enter().append("path", "g")
        .merge(links).attr("class", "link")
        .attr("d", function (d) {
            return diagonal(d, d.parent);
        });

    links.exit().remove();

    let nodes = svg.selectAll(".node").data(descendants, function (d) {
        return d.id
    });

    nodes.enter().append('foreignObject')
        .attr("class", "node")
        .each(function (d, i) {
            let r = d3.select(this).append("xhtml:div")
                .attr("class", "b-outer")
                .append("div")
                .attr('id', "id-" + d.id)
                .attr("class", "inner");
            enter_types[d.data.type].call(r, d);
        })
        .merge(nodes)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + (d.x - 50) + ")";
        })
        .attr('width', correction)
        .attr('height', 100)
        .each(function (d, i) {
            let selectAll = d3.selectAll("div#id-" + d.id);
            selectAll.selectAll(".name").text(`${d.data.state.name} ${d.data.type}`);
            selectAll.selectAll(".signal").text(d.data.props.signal);
            selectAll.selectAll(".battery").text(d.data.props.battery);
            selectAll.selectAll(".temperature").text(d.data.props.temperature);
            selectAll.selectAll(".power").text(d.data.props.power);
            selectAll.selectAll(".status").text(d.data.state.status);
            selectAll.selectAll(".target").text(d.data.state.target);
            selectAll.selectAll(".boost").text(d.data.state.boost);
            selectAll.selectAll(".boost-select").text('BOOST');
            selectAll.selectAll(".mode").property('value', d.data.state.mode);
        });

    nodes.exit().remove();
}

function form() {
    let schema = {
        fields: [
            {name: 'username', type: 'text', display: 'Username'},
            {name: 'password', type: 'password', display: 'Password'}
        ]
    };

    let form = d3.select("form").append("div").attr("class", "b-outer");

    let p = form.selectAll("p")
        .data(schema.fields)
        .enter()
        .append("div")
        .attr("class", "v-outer-h")
        .each(function (d) {
            let self = d3.select(this);
            let label = self.append("label")
                .text(d.display);

            let input = self.append("input")
                .attr("type", function (d) {
                    return d.type;
                })
                .attr("id", function (d) {
                    return d.name;
                })
                .attr("value", function (d) {
                    return d.default;
                });
        });

    form.append("button").attr('type', 'submit').text('Login');

    d3.select("form").on("submit", function () {
        d3.event.preventDefault();
        if (form.select("button").text() === 'Login') {
            hive = new Hive(form.select("#username").property("value"), form.select("#password").property("value"));
            hive.doLogin(function () {
                hive.update(update);
                form.select("button").text('Logout');
                interval = d3.interval(function () {
                    hive.update(update);
                }, 1500);
            })
        } else {
            interval.stop();
            form.select("button").text('Login');
            hive.doLogout();
            hive = undefined;
            update();
        }
    });
}

// var tau = 2 * Math.PI; // http://tauday.com/tau-manifesto
// var arc = d3.arc()
//     .innerRadius(180)
//     .outerRadius(240)
//     .startAngle(0);
//
// // Add the background arc, from 0 to 100% (tau).
// var background = g.append("path")
//     .datum({endAngle: tau})
//     .style("fill", "#ddd")
//     .attr("d", arc);
//
// // Add the foreground arc in orange, currently showing 12.7%.
// var foreground = g.append("path")
//     .datum({endAngle: 0.127 * tau})
//     .style("fill", "orange")
//     .attr("d", arc);
// Every so often, start a transition to a new random angle. The attrTween
// definition is encapsulated in a separate function (a closure) below.
// d3.interval(function() {
//     foreground.transition()
//         .duration(750)
//         .attrTween("d", arcTween(Math.random() * tau));
// }, 1500);
//
// function arcTween(newAngle) {
//     return function(d) {
//         var interpolate = d3.interpolate(d.endAngle, newAngle);
//         return function(t) {
//             d.endAngle = interpolate(t);
//             return arc(d);
//         };
//     };
//}