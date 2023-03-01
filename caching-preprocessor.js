const fs = require('fs'),
    process = require('process'),
    path = require('path');

let fileCache = new Map();
let preprocessorCache = new Map();
const preprocessorDepthLimit = 32;

var publicDir = process.cwd() + '/public';

function flushFileCache() {
    fileCache.clear();
}

function flushPreprocessorCache() {
    preprocessorCache.clear();
}

function loadUtf8(pathname) {
    pathname = checkPath(pathname);
    let promise = fileCache.get(pathname);

    if (!promise) {
        console.log('file cache miss for ' + pathname);
        promise = new Promise((resolve, reject) => {
            fs.readFile(pathname, {
                encoding: 'utf8'
            }, (err, data) => {
                if (!err)
                    resolve(data);
                else
                    reject(err);
            });
        });

        fileCache.set(pathname, promise);
    } else {
        console.log('file cache hit for ' + pathname);
    }

    return promise;
}

function checkPath(pathname) {
    let name = publicDir + pathname;
    let resolved = path.resolve(name);
    if (resolved.substring(0, publicDir.length + 1) !== publicDir + '/')
        throw new Error('Attempt to escape public directory with ' + name +
            ' escaping ' + publicDir);
    if (pathname.substr(0, publicDir.length) !== publicDir)
        pathname = publicDir + pathname;
    return pathname;
}

function preprocessFile(pathname, includeStack) {
    includeStack = includeStack || [];
    console.log('include stack=', includeStack);

    //console.log('preprocessing ', pathname);

    let key = checkPath(pathname);

    if (includeStack.length >= preprocessorDepthLimit || 
            includeStack.includes(key)) {
        // It can't complete the thing it needs to wait on because we
        // are blocking that thing from completing
        return Promise.reject(new Error('Circular include detected,' + 
            ' include path includes ' + key + ' again from: ' + 
            includeStack.join(' from ')));
    }

    includeStack.push(key);
    
    let promise = preprocessorCache.get(key);

    let parent = path.dirname(key);

    //console.log('parent of ', key, ' is ', parent);

    const preamble = '<?include ';
    const suffix = '?>';

    if (!promise) {
        console.log('preprocessor cache miss for ' + key);
        promise = loadUtf8(pathname).then((data) => {
            let st, en = 0;
            let todo = [];

            // While we found a preable, starting at the last end
            while ((st = data.indexOf(preamble, en)) >= 0) {
                // Find the suffix closing this directive
                en = data.indexOf(suffix, st + preamble.length);
                if (en < 0)
                    throw new Error('Unclosed include directive' +
                        ', missing ' + suffix);
                // Include the suffix
                en += suffix.length;

                // Extract the string between the preamble and suffix
                let include = data.substring(st + preamble.length, 
                    en - suffix.length);

                // Extract the quoted include filename
                let match = include.match(/^\s*(["'])([^'"]+)\1\s*$/);

                if (!match)
                    throw new Error('Invalid include: ' + include);

                let includeFilename = match[2];

                let work = {
                    st: st,
                    en: en,
                    name: includeFilename
                };

                console.log('work:', work);
                
                todo.push(work);
            }

            let replacementPromises = todo.map((work) => {
                let name = (work.name[0] === '/')
                    ? publicDir + work.name 
                    : (parent + '/' + work.name);
                console.log('including ', name);
                return preprocessFile(name, includeStack.slice())
                .catch((err) => {
                    console.log('Error including ', name, ' in ', pathname,
                        ' from ', includeStack);
                    throw err;
                });
            });

            // Wait for all the recursive includes to finish
            return Promise.all(replacementPromises).then((replacements) => {
                let fragments = [];

                todo.forEach((work, index, todo) => {
                    let prevWork = index ? todo[index-1] : null;
                    if (prevWork && prevWork.en < work.st) {
                        // There is a previous fragment and there is a gap
                        // between the end of the previous fragment and the
                        // start of this fragment
                        fragments.push({
                            st: prevWork.en,
                            en: work.st,
                            src: data
                        });
                    } else if (!prevWork && work.st > 0) {
                        // This is the first one, and there is a gap before
                        // the first include
                        fragments.push({
                            st: 0,
                            en: work.st,
                            src: data
                        });
                    }

                    let replacement = replacements[index];

                    fragments.push({
                        st: 0,
                        en: replacement.length,
                        src: replacement
                    });
                });

                // Handle the region after the last include
                let lastFragment = todo.length ? todo[todo.length-1] : null;

                if (lastFragment && lastFragment.en < data.length) {
                    fragments.push({
                        st: lastFragment.en,
                        en: data.length,
                        src: data
                    });
                }

                // If there are no replacements, then return it as is, verbatim
                if (todo.length === 0)
                    return data;

                data = fragments.reduce((data, fragment) => {
                    return data + 
                        fragment.src.substring(fragment.st, fragment.en);
                }, '');

                console.log('Finished preprocessing ' + key);
                return data;
            });
        });

        console.log('Started preprocessing ' + key);
        preprocessorCache.set(key, promise);
    } else {
        console.log('preprocessor cache hit for ' + key);
    }

    return promise;
}

function interceptHtml(req, res, next) {
    // This runs for every request that made it this far
    
    // File with names that begin with . cannot be requested (hidden)
    let basename = path.basename(req.path);
    if (basename[0] === '.')
        throw new Error('Invalid attempt to read hidden files');
    
    // If the path ends with .htm or .html
    if (/\.htm(?:l)?$/.test(req.path)) {
        //console.log('preprocess!');
        let promise = preprocessFile(req.path);
        promise.then((content) => {
            res.setHeader('content-type', 'text/html; encoding=utf8');
            res.send(content);
            res.end();
        }).catch((err) => {
            res.status(500);
            // Developer grade message
            res.setHeader('content-type', 'text/plain');
            res.send(err.stack);
            // Intentionally vague user message, to get some clue what happened
            //res.send(err.message);
            res.end();
        });
        return;
    }

    // Don't know what to do, pass it on to the next handler(s)
    next();
}

function getPublicDir() {
    return publicDir;
}

module.exports = {
  loadUtf8,
  preprocessFile,
  flushFileCache,
  flushPreprocessorCache,
  interceptHtml,
  getPublicDir
};
