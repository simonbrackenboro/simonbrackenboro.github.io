function Hive (username, password) {
    this.username = username;
    this.password = password;

    this.error = function(error) {
        console.log(error);
    };

    let object = this;

    this.doLogin = function(callback) {
        d3.request("https://beekeeper-uk.hivehome.com:443/1.0/global/login")
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .on("error", function (error) {
                object.error(error);
            })
            .on("load", function (xhr) {
                object.login = JSON.parse(xhr.responseText);
                object.baseURL = object.login.platform.endpoint;
                if (typeof callback !== "undefined") {
                    callback();
                }
            })
            .send("POST", JSON.stringify({
                username: username,
                password: password
            }));
    };

    this.doLogout = function(callback) {
        d3.request(object.baseURL + '/auth/logout')
            .header("Content-Type", "text/plain")
            .header("authorization", object.login.token)
            .on("error", function (error) {
                d3.event.preventDefault();
            })
            .on("load", function (xhr) {
                object.login = undefined;
                object.baseURL = undefined;
                if (typeof callback !== "undefined") {
                    callback(JSON.parse(xhr.responseText));
                }
            })
            .send("DELETE");
    };

    function get(url, callback) {
        d3.request(object.baseURL + url)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .header("authorization", object.login.token)
            .on("error", function (error) {
                if (JSON.parse(error.target.responseText).error === "NOT_AUTHORIZED") {
                    object.doLogin(object.username, object.password, function () {
                        object.get(url, callback);
                    });
                } else {
                    object.error(error);
                }
            })
            .on("load", function (xhr) {
                if (typeof callback !== "undefined") {
                    callback(JSON.parse(xhr.responseText));
                }
            })
            .send("GET", null);
    }

    function getDevices(callback) { get('/devices', callback)}
    function getProducts(callback) { get('/products', callback)}

    this.update = function(callback) {
        getDevices(function (devices) {
            getProducts(function (products) {

                object.devicesAndProducts = devices.concat(products);

                object.devicesAndProducts.forEach(function (e) {
                    if (e.type === "hub") {
                        e.parent = undefined;
                    }
                });

                callback(object.devicesAndProducts);
            })
        })
    };

    this.setMode = function(callback, device, type, mode, target, duration) {
        var data = { 'mode' : mode};
        if(target !== 'undefined')
            data.target = Number(target);
        if(duration !== 'undefined')
            data.boost = Number(duration);

        d3.request(object.baseURL + '/nodes/'+type+'/' + device)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .header("authorization", object.login.token)
            .on("error", function (error) {
                if (JSON.parse(error.target.responseText).error === "NOT_AUTHORIZED") {
                    object.doLogin(state.username, state.password, function () {
                        object.get(url, callback);
                    });
                } else {
                    object.error(error);
                }
            })
            .on("load", function (xhr) {
                if (typeof callback !== "undefined") {
                    callback(JSON.parse(xhr.responseText));
                }
            })
            .send("POST", JSON.stringify(data));
    }
}