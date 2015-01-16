// Copyright 2013 Mark Cavage, Inc.  All rights reserved.

var os = require('os');
var Stream = require('stream').Stream;
var util = require('util');
var exec = require('child_process').execFile;

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

        //if (this.constructor.name === 'HipChatStream') {
        //        binding.openlog(this.name, binding.LOG_CONS, 0);
        //        process.nextTick(this.emit.bind(this, 'connect'));
        //}
}
util.inherits(HipChatStream, Stream);
module.exports = HipChatStream;


// Overriden by TCP/UDP
HipChatStream.prototype.close = function close() {
        binding.closelog();
};


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

        var h;
        var l;
        var m;
        var t;

        if (Buffer.isBuffer(r)) {
                // expensive, but not expected
                m = r.toString('utf8');
        } else if (typeof (r) === 'object') {
                h = r.hostname;
                l = r.level;
                m = JSON.stringify(r, bunyan.safeCycles());
                t = time(r.time);
        } else if (typeof (r) === 'string') {
                m = r;
        } else {
                throw new TypeError('record (Object) required');
        }


	var msg = "<b>Updated consul keys:</b<br/><table border=1><tr><th><b>Key</b></th><th><b>Value</b></th></tr>";
	var rowTemplate = "<tr><td>%s</td><td>%s</td></tr>";
	Object.keys(r.consul).forEach(function(element) {
		msg = msg + sprintf(rowTemplate, element, r.consul[element]);
	});
	msg = msg + "</table>";

	exec('/usr/local/bin/hipchat.sh', ['-i ' + msg].concat(this.hipchatOpts || []), function(error, stdout, stderr){

	});

};


HipChatStream.prototype.toString = function toString() {
        var str = '[object HipChatStream<facility=' + this.facility;
        if (this.host)
                str += ', host=' + this.host;
        if (this.port)
                str += ', port=' + this.port;
        if (!/^Sys/.test(this.constructor.name)) {
                str += ', proto=' +
                        (/UDP/.test(this.constructor.name) ? 'udp' : 'tcp');
        }
        str += '>]';

        return (str);
};
