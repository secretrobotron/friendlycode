#! /usr/local/bin/node

var express = require('express');
var knox = require('knox');
var habitat = require('habitat');
var os = require('os');
var path = require('path');
var shortid = require('shortid');
var nunjucks = require('nunjucks');
var fs = require('fs');
var Bitly = require('bitly');

habitat.load();

var env = new habitat();
var s3 = env.get('S3');

var express = require('express');
var app = express();

var client = knox.createClient({
  key: s3.key,
  secret: s3.secret,
  bucket: s3.bucket
});

var publishTemplate;
fs.readFile(path.join(__dirname, '../publish/template.html'), 'utf-8', function (err, data) {
  publishTemplate = new nunjucks.Template(data.toString('utf8'));
});

app.use(express.bodyParser());

function sendKnoxHTMLRequest (filename, data, callback) {
  var knoxReq = client.put(filename, {
    'x-amz-acl': 'public-read',
    'Content-Length': Buffer.byteLength(data, 'utf8'),
    'Content-Type': 'text/html'
  });

  knoxReq.on('response', callback);

  knoxReq.end(data);
}

var bitlyConfig = env.get('BITLY');
var bitly = new Bitly(bitlyConfig.user, bitlyConfig.key);

var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, '../examples')));
nunjucksEnv.express(app);

app.get('/examples/:page', function (req, res) {
  res.render(req.params.page, {
    publishURL: 'http://appbuilder-thimble.herokuapp.com.s3.amazonaws.com'
  });
});

app.use(express.static(path.join(__dirname, '../')));

app.post('/api/page', function (req, res) {
  var inputData = req.body;
  var htmlData = inputData.html;

  var wrapperFilename = shortid.generate();
  var dataFilename = wrapperFilename + '_';

  var iframeUrl = 'http://s3.amazonaws.com/' + s3.bucket + '/' + dataFilename;
  var wrapperUrl = 'http://s3.amazonaws.com/' + s3.bucket + '/' + wrapperFilename;

  var htmlWrapper = publishTemplate.render({
    iframeUrl: iframeUrl
  });

  sendKnoxHTMLRequest(wrapperFilename, htmlWrapper, function (knoxRes) {
    if (200 == knoxRes.statusCode) {
      sendKnoxHTMLRequest(dataFilename, htmlData, function (knoxRes) {
        if (200 == knoxRes.statusCode) {
          bitly.shorten(wrapperUrl, function(err, response) {
            var url = (err || response.status_code !== 200) ? wrapperUrl : response.data.url;
            res.json({code: dataFilename, url: url}, 200);
          });
        }
        else {
          res.send('Couldn\'t save to S3', 500);
        }
      });
    }
    else {
      res.send('Couldn\'t save to S3', 500);
    }
  });
});

app.use(express.logger("dev"));

app.listen(env.get("PORT"), function(){
  console.log('Express server listening on ' + os.hostname());
});