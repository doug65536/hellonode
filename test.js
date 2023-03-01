#!/bin/env node
var express = require('express'),
    cachingPreprocessor = require('./caching-preprocessor.js'),
    app = express(),
    ipaddress = process.env.NODEJS_IP || '0.0.0.0',
    port = process.env.NODEJS_PORT || 8080;

app.use(cachingPreprocessor.interceptHtml);

// Just serve the public/ directory for anything that didn't get caught
// by the middleware above that intercepts everything that ends with .html
app.use(express.static(cachingPreprocessor.getPublicDir()));
app.listen(port, ipaddress);

