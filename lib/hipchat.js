// Copyright 2013 Mark Cavage, Inc.  All rights reserved.
/* vim: set tabstop=4 softtabstop=0 expandtab shiftwidth=4 smarttab : */
var os = require('os');
var Stream = require('stream').Stream;
var util = require('util');
var exec = require('child_process').exec;
var http = require('http');
var qs = require('querystring');
var fs = require('fs');

///--- Globals

var sprintf = util.format;

var HOSTNAME = os.hostname();

// Harcoded from https://github.com/trentm/node-bunyan so this module
// can have minimal dependencies
var bunyan = {
        FATAL: 60,
        ERROR: 50,
        WARN:  40,
        INFO:  30,
        DEBUG: 20,
        TRACE: 10,

        safeCycles: function safeCycles() {
                var seen = [];
                function bunyanCycles(k, v) {
                        if (!v || typeof (v) !== 'object') {
                                return (v);
                        }
                        if (seen.indexOf(v) !== -1) {
                                return ('[Circular]');
                        }
                        seen.push(v);
                        return (v);
                }

                return (bunyanCycles);
        }
};


// Syslog Levels

///--- Helpers

// Translates a Bunyan level into a syslog level

function time(t) {
        return (new Date(t).toJSON());
}



///--- API

function HipChatStream(opts) {

        Stream.call(this);

        this.name = opts.name || process.title || process.argv[0];
        this.writable = true;
        this.opts = opts;
        this.hipchatOpts = opts.hipchatOpts;
        //if (this.constructor.name === 'HipChatStream') {
        //        binding.openlog(this.name, binding.LOG_CONS, 0);
        //        process.nextTick(this.emit.bind(this, 'connect'));
        //}
}
util.inherits(HipChatStream, Stream);
module.exports = HipChatStream;


// Overriden by TCP/UDP

HipChatStream.prototype.destroy = function destroy() {
        this.writable = false;
        this.close();
};


HipChatStream.prototype.end = function end() {
        if (arguments.length > 0)
                this.write.apply(this, Array.prototype.slice.call(arguments));

        this.writable = false;
        this.close();
};


HipChatStream.prototype.write = function write(r) {
        if (!this.writable)
                throw new Error('HipChatStream has been ended already');

        var msg = "<b>Updated consul keys:</b<br/><table border=1><tr><th><b>Key</b></th><th><b>Value</b></th></tr>";
        var rowTemplate = "<tr><td>%s</td><td>%s</td></tr>";

        var m;

        if (typeof (r) === 'object' && r.consul) {
            m = msg;
            Object.keys(r.consul).forEach(function(element) {
                m = m + sprintf(rowTemplate, element, r.consul[element]);
            });

        } else {
                // Ignore logs without consul value
                return;
        }


    m = m + "</table>";

    var hcdata = fs.readFileSync('/etc/hipchat', "utf-8").split('\n');;
    var token = null;
    var name = null;

    hcdata.forEach(function(el, idx, arr){
        var sp = el.split('=');
        if (sp.length != 2){
            return;
        }
        var k = sp[0].trim();
        var v = sp[1].trim();

        if (k === 'HIPCHAT_TOKEN'){
            token = v;
        }

    });


    var data = qs.stringify({
            "auth_token" : token,
            "from" : ((r.branch) || (os.hostname() + '-bot')).substring(0,15),
            "message" : m,
            "room_id" : "Deploy"
            });


    var options = {
        host: 'api.hipchat.com',
        path: '/v1/rooms/message',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };


    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log("body: " + chunk);
        });
    });

    req.write(data);
    req.end();

};


HipChatStream.prototype.toString = function toString() {
        var str = '[object HipChatStream<opts=' + this.opts;
        str += '>]';

        return (str);
};
