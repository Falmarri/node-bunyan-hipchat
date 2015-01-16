// Copyright 2013 Mark Cavage, Inc.  All rights reserved.

var bunyan = require('bunyan');
var test = require('tap').test;

var bsyslog = require('../lib');



///--- Globals

var I = 0;
var LOG;
var STREAM;



///--- Tests



test('create a logger', function (t) {
        STREAM = bsyslog.createBunyanStream({
                name: 'sys_test',
                type: 'sys',
		hipchatOpts : ['-r Deploy']
        });
	t.ok(STREAM);
        console.error(STREAM.toString());


        LOG = bunyan.createLogger({
                name: 'systest',
                streams: [ {
                        type: 'raw',
                        level: 'trace',
                        stream: STREAM
                },
		{
			path : '/home/falmarri/hclog.log',
			level: 'trace'
		}]
        });
	t.ok(LOG);
	t.end();
});



test('write a trace record', function (t) {
        LOG.trace({i: I++}, 'sample %s record', 'trace');
        t.end();
});


test('write a debug record', function (t) {
        LOG.debug({i: I++}, 'sample %s record', 'debug');
        t.end();
});


test('write a info record', function (t) {
        LOG.info({i: I++}, 'sample %s record', 'info');
        t.end();
});


test('write a warn record', function (t) {
        LOG.warn({i: I++}, 'sample %s record', 'warn');
        t.end();
});


test('write a error record', function (t) {
        LOG.error({i: I++}, 'sample %s record', 'error');
        t.end();
});


test('write a fatal record', function (t) {
        LOG.fatal({i: I++}, 'sample %s record', 'fatal');
        t.end();
});


test('teardown', function (t) {
        t.end();
});
