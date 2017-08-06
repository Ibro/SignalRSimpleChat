(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.signalR = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function splitAt(input, searchString, position) {
        let index = input.indexOf(searchString, position);
        if (index < 0) {
            return [input.substr(position), input.length];
        }
        let left = input.substring(position, index);
        return [left, index + searchString.length];
    }
    var TextMessageFormat;
    (function (TextMessageFormat) {
        const InvalidPayloadError = new Error("Invalid text message payload");
        const LengthRegex = /^[0-9]+$/;
        function hasSpace(input, offset, length) {
            let requiredLength = offset + length;
            return input.length >= requiredLength;
        }
        function parseMessage(input, position) {
            var offset = position;
            // Read the length
            var [lenStr, offset] = splitAt(input, ":", offset);
            // parseInt is too leniant, we need a strict check to see if the string is an int
            if (!LengthRegex.test(lenStr)) {
                throw new Error(`Invalid length: '${lenStr}'`);
            }
            let length = Number.parseInt(lenStr);
            // Required space is: (";") + length (payload len)
            if (!hasSpace(input, offset, 1 + length)) {
                throw new Error("Message is incomplete");
            }
            // Read the payload
            var payload = input.substr(offset, length);
            offset += length;
            // Verify the final trailing character
            if (input[offset] != ';') {
                throw new Error("Message missing trailer character");
            }
            offset += 1;
            return [offset, payload];
        }
        function write(output) {
            return `${output.length}:${output};`;
        }
        TextMessageFormat.write = write;
        function parse(input) {
            if (input.length == 0) {
                return [];
            }
            let messages = [];
            var offset = 0;
            while (offset < input.length) {
                let message;
                [offset, message] = parseMessage(input, offset);
                messages.push(message);
            }
            return messages;
        }
        TextMessageFormat.parse = parse;
    })(TextMessageFormat = exports.TextMessageFormat || (exports.TextMessageFormat = {}));
});

},{}],2:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./HttpError"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HttpError_1 = require("./HttpError");
    class HttpClient {
        get(url, headers) {
            return this.xhr("GET", url, headers);
        }
        options(url, headers) {
            return this.xhr("OPTIONS", url, headers);
        }
        post(url, content, headers) {
            return this.xhr("POST", url, headers, content);
        }
        xhr(method, url, headers, content) {
            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                if (headers) {
                    headers.forEach((value, header) => xhr.setRequestHeader(header, value));
                }
                xhr.send(content);
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    }
                    else {
                        reject(new HttpError_1.HttpError(xhr.statusText, xhr.status));
                    }
                };
                xhr.onerror = () => {
                    reject(new HttpError_1.HttpError(xhr.statusText, xhr.status));
                };
            });
        }
    }
    exports.HttpClient = HttpClient;
});

},{"./HttpError":4}],3:[function(require,module,exports){
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Transports", "./HttpClient"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Transports_1 = require("./Transports");
    const HttpClient_1 = require("./HttpClient");
    var ConnectionState;
    (function (ConnectionState) {
        ConnectionState[ConnectionState["Initial"] = 0] = "Initial";
        ConnectionState[ConnectionState["Connecting"] = 1] = "Connecting";
        ConnectionState[ConnectionState["Connected"] = 2] = "Connected";
        ConnectionState[ConnectionState["Disconnected"] = 3] = "Disconnected";
    })(ConnectionState || (ConnectionState = {}));
    class HttpConnection {
        constructor(url, options = {}) {
            this.url = url;
            this.httpClient = options.httpClient || new HttpClient_1.HttpClient();
            this.connectionState = ConnectionState.Initial;
            this.options = options;
        }
        start() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.connectionState != ConnectionState.Initial) {
                    return Promise.reject(new Error("Cannot start a connection that is not in the 'Initial' state."));
                }
                this.connectionState = ConnectionState.Connecting;
                this.startPromise = this.startInternal();
                return this.startPromise;
            });
        }
        startInternal() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let negotiatePayload = yield this.httpClient.options(this.url);
                    let negotiateResponse = JSON.parse(negotiatePayload);
                    this.connectionId = negotiateResponse.connectionId;
                    // the user tries to stop the the connection when it is being started
                    if (this.connectionState == ConnectionState.Disconnected) {
                        return;
                    }
                    this.url += (this.url.indexOf("?") == -1 ? "?" : "&") + `id=${this.connectionId}`;
                    this.transport = this.createTransport(this.options.transport, negotiateResponse.availableTransports);
                    this.transport.onDataReceived = this.onDataReceived;
                    this.transport.onClosed = e => this.stopConnection(true, e);
                    yield this.transport.connect(this.url);
                    // only change the state if we were connecting to not overwrite
                    // the state if the connection is already marked as Disconnected
                    this.changeState(ConnectionState.Connecting, ConnectionState.Connected);
                }
                catch (e) {
                    console.log("Failed to start the connection. " + e);
                    this.connectionState = ConnectionState.Disconnected;
                    this.transport = null;
                    throw e;
                }
                ;
            });
        }
        createTransport(transport, availableTransports) {
            if (!transport && availableTransports.length > 0) {
                transport = Transports_1.TransportType[availableTransports[0]];
            }
            if (transport === Transports_1.TransportType.WebSockets && availableTransports.indexOf(Transports_1.TransportType[transport]) >= 0) {
                return new Transports_1.WebSocketTransport();
            }
            if (transport === Transports_1.TransportType.ServerSentEvents && availableTransports.indexOf(Transports_1.TransportType[transport]) >= 0) {
                return new Transports_1.ServerSentEventsTransport(this.httpClient);
            }
            if (transport === Transports_1.TransportType.LongPolling && availableTransports.indexOf(Transports_1.TransportType[transport]) >= 0) {
                return new Transports_1.LongPollingTransport(this.httpClient);
            }
            if (this.isITransport(transport)) {
                return transport;
            }
            throw new Error("No available transports found.");
        }
        isITransport(transport) {
            return typeof (transport) === "object" && "connect" in transport;
        }
        changeState(from, to) {
            if (this.connectionState == from) {
                this.connectionState = to;
                return true;
            }
            return false;
        }
        send(data) {
            if (this.connectionState != ConnectionState.Connected) {
                throw new Error("Cannot send data if the connection is not in the 'Connected' State");
            }
            return this.transport.send(data);
        }
        stop() {
            return __awaiter(this, void 0, void 0, function* () {
                let previousState = this.connectionState;
                this.connectionState = ConnectionState.Disconnected;
                try {
                    yield this.startPromise;
                }
                catch (e) {
                    // this exception is returned to the user as a rejected Promise from the start method
                }
                this.stopConnection(/*raiseClosed*/ previousState == ConnectionState.Connected);
            });
        }
        stopConnection(raiseClosed, error) {
            if (this.transport) {
                this.transport.stop();
                this.transport = null;
            }
            this.connectionState = ConnectionState.Disconnected;
            if (raiseClosed && this.onClosed) {
                this.onClosed(error);
            }
        }
    }
    exports.HttpConnection = HttpConnection;
});

},{"./HttpClient":2,"./Transports":8}],4:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HttpError extends Error {
        constructor(errorMessage, statusCode) {
            super(errorMessage);
            this.statusCode = statusCode;
        }
    }
    exports.HttpError = HttpError;
});

},{}],5:[function(require,module,exports){
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Observable", "./Transports", "./HttpConnection", "./JsonHubProtocol", "./Formatters"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Observable_1 = require("./Observable");
    var Transports_1 = require("./Transports");
    exports.TransportType = Transports_1.TransportType;
    var HttpConnection_1 = require("./HttpConnection");
    exports.HttpConnection = HttpConnection_1.HttpConnection;
    const JsonHubProtocol_1 = require("./JsonHubProtocol");
    const Formatters_1 = require("./Formatters");
    class HubConnection {
        constructor(connection) {
            this.connection = connection;
            this.connection.onDataReceived = data => {
                this.onDataReceived(data);
            };
            this.connection.onClosed = (error) => {
                this.onConnectionClosed(error);
            };
            this.callbacks = new Map();
            this.methods = new Map();
            this.id = 0;
            this.protocol = new JsonHubProtocol_1.JsonHubProtocol();
        }
        onDataReceived(data) {
            // Parse the messages
            let messages = this.protocol.parseMessages(data);
            for (var i = 0; i < messages.length; ++i) {
                var message = messages[i];
                switch (message.type) {
                    case 1 /* Invocation */:
                        this.invokeClientMethod(message);
                        break;
                    case 2 /* Result */:
                    case 3 /* Completion */:
                        let callback = this.callbacks.get(message.invocationId);
                        if (callback != null) {
                            callback(message);
                            if (message.type == 3 /* Completion */) {
                                this.callbacks.delete(message.invocationId);
                            }
                        }
                        break;
                    default:
                        console.log("Invalid message type: " + data);
                        break;
                }
            }
        }
        invokeClientMethod(invocationMessage) {
            let method = this.methods.get(invocationMessage.target);
            if (method) {
                method.apply(this, invocationMessage.arguments);
                if (!invocationMessage.nonblocking) {
                    // TODO: send result back to the server?
                }
            }
            else {
                console.log(`No client method with the name '${invocationMessage.target}' found.`);
            }
        }
        onConnectionClosed(error) {
            let errorCompletionMessage = {
                type: 3 /* Completion */,
                invocationId: "-1",
                error: error ? error.message : "Invocation cancelled due to connection being closed.",
            };
            this.callbacks.forEach(callback => {
                callback(errorCompletionMessage);
            });
            this.callbacks.clear();
            if (this.connectionClosedCallback) {
                this.connectionClosedCallback(error);
            }
        }
        start() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.connection.start();
                yield this.connection.send(Formatters_1.TextMessageFormat.write(JSON.stringify({ protocol: this.protocol.name() })));
            });
        }
        stop() {
            return this.connection.stop();
        }
        stream(methodName, ...args) {
            let invocationDescriptor = this.createInvocation(methodName, args, false);
            let subject = new Observable_1.Subject();
            this.callbacks.set(invocationDescriptor.invocationId, (invocationEvent) => {
                if (invocationEvent.type === 3 /* Completion */) {
                    let completionMessage = invocationEvent;
                    if (completionMessage.error) {
                        subject.error(new Error(completionMessage.error));
                    }
                    else if (completionMessage.result) {
                        subject.error(new Error("Server provided a result in a completion response to a streamed invocation."));
                    }
                    else {
                        // TODO: Log a warning if there's a payload?
                        subject.complete();
                    }
                }
                else {
                    subject.next(invocationEvent.item);
                }
            });
            let message = this.protocol.writeMessage(invocationDescriptor);
            this.connection.send(message)
                .catch(e => {
                subject.error(e);
                this.callbacks.delete(invocationDescriptor.invocationId);
            });
            return subject;
        }
        send(methodName, ...args) {
            let invocationDescriptor = this.createInvocation(methodName, args, true);
            let message = this.protocol.writeMessage(invocationDescriptor);
            return this.connection.send(message);
        }
        invoke(methodName, ...args) {
            let invocationDescriptor = this.createInvocation(methodName, args, false);
            let p = new Promise((resolve, reject) => {
                this.callbacks.set(invocationDescriptor.invocationId, (invocationEvent) => {
                    if (invocationEvent.type === 3 /* Completion */) {
                        let completionMessage = invocationEvent;
                        if (completionMessage.error) {
                            reject(new Error(completionMessage.error));
                        }
                        else {
                            resolve(completionMessage.result);
                        }
                    }
                    else {
                        reject(new Error("Streaming methods must be invoked using HubConnection.stream"));
                    }
                });
                let message = this.protocol.writeMessage(invocationDescriptor);
                this.connection.send(message)
                    .catch(e => {
                    reject(e);
                    this.callbacks.delete(invocationDescriptor.invocationId);
                });
            });
            return p;
        }
        on(methodName, method) {
            this.methods.set(methodName, method);
        }
        set onClosed(callback) {
            this.connectionClosedCallback = callback;
        }
        createInvocation(methodName, args, nonblocking) {
            let id = this.id;
            this.id++;
            return {
                type: 1 /* Invocation */,
                invocationId: id.toString(),
                target: methodName,
                arguments: args,
                nonblocking: nonblocking
            };
        }
    }
    exports.HubConnection = HubConnection;
});

},{"./Formatters":1,"./HttpConnection":3,"./JsonHubProtocol":6,"./Observable":7,"./Transports":8}],6:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Formatters"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Formatters_1 = require("./Formatters");
    class JsonHubProtocol {
        name() {
            return "json";
        }
        parseMessages(input) {
            if (!input) {
                return [];
            }
            // Parse the messages
            let messages = Formatters_1.TextMessageFormat.parse(input);
            let hubMessages = [];
            for (var i = 0; i < messages.length; ++i) {
                hubMessages.push(JSON.parse(messages[i]));
            }
            return hubMessages;
        }
        writeMessage(message) {
            return Formatters_1.TextMessageFormat.write(JSON.stringify(message));
        }
    }
    exports.JsonHubProtocol = JsonHubProtocol;
});

},{"./Formatters":1}],7:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Subject {
        constructor() {
            this.observers = [];
        }
        next(item) {
            for (let observer of this.observers) {
                observer.next(item);
            }
        }
        error(err) {
            for (let observer of this.observers) {
                observer.error(err);
            }
        }
        complete() {
            for (let observer of this.observers) {
                observer.complete();
            }
        }
        subscribe(observer) {
            this.observers.push(observer);
        }
    }
    exports.Subject = Subject;
});

},{}],8:[function(require,module,exports){
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TransportType;
    (function (TransportType) {
        TransportType[TransportType["WebSockets"] = 0] = "WebSockets";
        TransportType[TransportType["ServerSentEvents"] = 1] = "ServerSentEvents";
        TransportType[TransportType["LongPolling"] = 2] = "LongPolling";
    })(TransportType = exports.TransportType || (exports.TransportType = {}));
    class WebSocketTransport {
        connect(url, queryString = "") {
            return new Promise((resolve, reject) => {
                url = url.replace(/^http/, "ws");
                let webSocket = new WebSocket(url);
                webSocket.onopen = (event) => {
                    console.log(`WebSocket connected to ${url}`);
                    this.webSocket = webSocket;
                    resolve();
                };
                webSocket.onerror = (event) => {
                    reject();
                };
                webSocket.onmessage = (message) => {
                    console.log(`(WebSockets transport) data received: ${message.data}`);
                    if (this.onDataReceived) {
                        this.onDataReceived(message.data);
                    }
                };
                webSocket.onclose = (event) => {
                    // webSocket will be null if the transport did not start successfully
                    if (this.onClosed && this.webSocket) {
                        if (event.wasClean === false || event.code !== 1000) {
                            this.onClosed(new Error(`Websocket closed with status code: ${event.code} (${event.reason})`));
                        }
                        else {
                            this.onClosed();
                        }
                    }
                };
            });
        }
        send(data) {
            if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
                this.webSocket.send(data);
                return Promise.resolve();
            }
            return Promise.reject("WebSocket is not in the OPEN state");
        }
        stop() {
            if (this.webSocket) {
                this.webSocket.close();
                this.webSocket = null;
            }
        }
    }
    exports.WebSocketTransport = WebSocketTransport;
    class ServerSentEventsTransport {
        constructor(httpClient) {
            this.httpClient = httpClient;
        }
        connect(url) {
            if (typeof (EventSource) === "undefined") {
                Promise.reject("EventSource not supported by the browser.");
            }
            this.url = url;
            return new Promise((resolve, reject) => {
                let eventSource = new EventSource(this.url);
                try {
                    eventSource.onmessage = (e) => {
                        if (this.onDataReceived) {
                            try {
                                console.log(`(SSE transport) data received: ${e.data}`);
                                this.onDataReceived(e.data);
                            }
                            catch (error) {
                                if (this.onClosed) {
                                    this.onClosed(error);
                                }
                                return;
                            }
                        }
                    };
                    eventSource.onerror = (e) => {
                        reject();
                        // don't report an error if the transport did not start successfully
                        if (this.eventSource && this.onClosed) {
                            this.onClosed(new Error(e.message || "Error occurred"));
                        }
                    };
                    eventSource.onopen = () => {
                        console.log(`SSE connected to ${this.url}`);
                        this.eventSource = eventSource;
                        resolve();
                    };
                }
                catch (e) {
                    return Promise.reject(e);
                }
            });
        }
        send(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return send(this.httpClient, this.url, data);
            });
        }
        stop() {
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = null;
            }
        }
    }
    exports.ServerSentEventsTransport = ServerSentEventsTransport;
    class LongPollingTransport {
        constructor(httpClient) {
            this.httpClient = httpClient;
        }
        connect(url) {
            this.url = url;
            this.shouldPoll = true;
            this.poll(this.url);
            return Promise.resolve();
        }
        poll(url) {
            if (!this.shouldPoll) {
                return;
            }
            let pollXhr = new XMLHttpRequest();
            pollXhr.onload = () => {
                if (pollXhr.status == 200) {
                    if (this.onDataReceived) {
                        try {
                            if (pollXhr.response) {
                                console.log(`(LongPolling transport) data received: ${pollXhr.response}`);
                                this.onDataReceived(pollXhr.response);
                            }
                            else {
                                console.log(`(LongPolling transport) timed out`);
                            }
                        }
                        catch (error) {
                            if (this.onClosed) {
                                this.onClosed(error);
                            }
                            return;
                        }
                    }
                    this.poll(url);
                }
                else if (this.pollXhr.status == 204) {
                    if (this.onClosed) {
                        this.onClosed();
                    }
                }
                else {
                    if (this.onClosed) {
                        this.onClosed(new Error(`Status: ${pollXhr.status}, Message: ${pollXhr.responseText}`));
                    }
                }
            };
            pollXhr.onerror = () => {
                if (this.onClosed) {
                    // network related error or denied cross domain request
                    this.onClosed(new Error("Sending HTTP request failed."));
                }
            };
            pollXhr.ontimeout = () => {
                this.poll(url);
            };
            this.pollXhr = pollXhr;
            this.pollXhr.open("GET", url, true);
            // TODO: consider making timeout configurable
            this.pollXhr.timeout = 120000;
            this.pollXhr.send();
        }
        send(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return send(this.httpClient, this.url, data);
            });
        }
        stop() {
            this.shouldPoll = false;
            if (this.pollXhr) {
                this.pollXhr.abort();
                this.pollXhr = null;
            }
        }
    }
    exports.LongPollingTransport = LongPollingTransport;
    const headers = new Map();
    function send(httpClient, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield httpClient.post(url, data, headers);
        });
    }
});

},{}]},{},[5])(5)
});