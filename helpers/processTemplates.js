const fs = require('fs');
const gs = require('glob-stream');
const _template = require('lodash.template');
const reduce = require('through2-reduce');
const map = require('through2-map');
const ora = require('ora');
const promisefyStream = require('./promisefyStream');

module.exports = processTemplates;

function createTemplateStream (path, info) {
    return fs.createReadStream(path)
        .pipe(reduce((file, chunk) => file + template(chunk, info), ''))
        .pipe(fs.createWriteStream(path.replace('.tmp/', `${info.name}/`)));
}

function template (buffer, data) {
    return _template(buffer.toString())(data);
}

function processTemplates (info) {
    const stream = gs.create(['.tmp/**/*.*', '!.tmp/.git/**/*'])
        .pipe(map({objectMode: true}, chunk => createTemplateStream(chunk.path, info)));

    const spinner = ora('Processing templates').start();

    return promisefyStream(stream)
        .then(spinner.succeed.bind(spinner))
        .catch(spinner.fail.bind(spinner));
};
