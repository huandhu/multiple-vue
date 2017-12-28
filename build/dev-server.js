
var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var express = require('express')
var glob = require('glob')
var path = require('path')
var webpack = require('webpack')
var fs = require('fs')
var proxyMiddleware = require('http-proxy-middleware')

var port = process.env.PORT || config.dev.port
var autoOpenBrowser = !!config.dev.autoOpenBrowser
var proxyTable = config.dev.proxyTable
var webpackConfig = process.env.NODE_ENV === 'production'
  ? require('./webpack.prod.conf')
  : require('./webpack.dev.conf')

var app = express()
var compiler = webpack(webpackConfig)


var devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: false,
    heartbeat: 2000
})

compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
        hotMiddleware.publish({ action: 'reload' })
        cb()
    })
})

Object.keys(proxyTable).forEach(function (context) {
    var options = proxyTable[context]
    if (typeof options === 'string') {
        options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
})

app.use(devMiddleware)
app.use(hotMiddleware)

var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

/// 获取指定路径下的入口文件
function getEntries(globPath) {
    var files = glob.sync(globPath),
        pages = [];
  
    files.forEach(function(filepath) {
        // 取倒数第二层(view下面的文件夹)做包名
        var split = filepath.split('/');
        var name = split[split.length - 2];
  
        pages.push(name)
    })
    return pages
}

/** 
 * router 
 * */
app.get('/', function (req, res) {
    var pages = getEntries('./views/**/**.js')
    var pageCnt = ''
    pages.forEach(function (page) {
        pageCnt += '<h3 style="height: 30px; line-height: 30px; border-bottom: 1px solid #dcdcdc;"><a href="/' + page + '">' + page + '.html</a><h3>'
    })
    fs.readFile('./index.html', 'utf8', function (err, data) {
        pageCnt = data.replace(/\/\*\* page content \*\*\//g, pageCnt)
        res.send(pageCnt);
        res.end();
    })
 })

 app.get('/:viewname', function (req, res) {
    var viewname = req.params.viewname 
        ? req.params.viewname + '.html' 
        : 'index.html';

    var filepath = path.join(compiler.outputPath, viewname);

    // 使用webpack提供的outputFileSystem
    compiler.outputFileSystem.readFile(filepath, function(err, result) {
        res.set('content-type', 'text/html');
        res.send(result);
        res.end();
    })
 })


var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
  if (autoOpenBrowser) {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
