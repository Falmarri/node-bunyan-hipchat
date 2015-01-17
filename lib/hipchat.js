// Copyright 2013 Mark Cavage, Inc.  All rights reserved.
/* vim: set tabstop=4 softtabstop=0 expandtab shiftwidth=4 smarttab : */
var os = require('os');
var Stream = require('stream').Stream;
var util = require('util');
var exec = require('child_process').exec;

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

    var cmd = '/usr/local/bin/hipchat.sh -i "' + m + '" ' + (this.hipchatOpts || []).join(' ');
    exec(cmd, {'timeout': 2}, function(error, stdout, stderr){
        console.error('stdout: ' + stdout);
        console.error('stderr: ' + stderr);
        if (error !== null) {
            console.error('exec error: ' + error);
        }
    });

};


HipChatStream.prototype.toString = function toString() {
        var str = '[object HipChatStream<opts=' + this.opts;
        str += '>]';

        return (str);
};
