// Copyright 2013 Mark Cavage, Inc.  All rights reserved.

var HipChatStream = require('./hipchat');



///--- Exports

module.exports = {
        createBunyanStream: function createBunyanStream(opts) {
                opts = opts || {};

                return new HipChatStream(opts);
        }

};

