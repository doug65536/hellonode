#!/bin/env node
var express = require('express'),
    app = express(),
    ipaddress = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.get('/dumpenv', function(req, res) {
    res.send(process.env);
});

app.use(express.static('public/'));
app.listen(port, ipaddress);

