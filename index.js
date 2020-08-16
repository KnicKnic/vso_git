var mime = require('mime-types')
const fetch = require('node-fetch');
const express = require('express');
const path = require('path')
// var ZIP = require('@ronomon/zip');
let app = express();

let contentAge = 120;
let cacheControlStr = "private, must-revalidate, max-age=" + contentAge
// Need to use https://docs.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-5.0 instead of other options, seems to work for listings and

// add support for listing https://docs.microsoft.com/en-us/rest/api/azure/devops/build/source%20providers/get%20path%20contents?view=azure-devops-rest-5.0


async function serveFile(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW, mimeType) {

    //  var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/sourceProviders/tfsgit/filecontents?&repository=" + repo + "&commitOrBranch=" + branch +"&path=" + remainder + "&api-version=5.0-preview.1"


    // var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/sourceProviders/tfsgit/pathcontents?&repository=" + repo + "&commitOrBranch=" + branch +"&path=" + remainder + "&api-version=5.0-preview.1"
    var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/git/repositories/" + repo + "/items?path=" + remainder + "&$format=zip&versionDescriptor.version=" + branch + "&versionDescriptor.versionType="+ versionType + "&api-version=5.0"
// you can drop &$format=zip and add &download=true
var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/git/repositories/" + repo + "/items?path=" + remainder + "&download=true&versionDescriptor.version=" + branch + "&versionDescriptor.versionType="+ versionType + "&api-version=5.0"

    console.log(str)
    console.log("\n")

    try {
        var data = await fetch(str)
        b = await data.buffer()
        // console.log(b)

        // try {
        //     var headers = ZIP.decode(b);
        // } catch (error) {
        //     console.error(error.message);
        // }

        // var file = ZIP.inflate(headers[0], b);

        // b = file
        if(mimeType == "normal" ){
            var mimeType = mime.lookup(remainder) || 'application/octet-stream'
            res.writeHead(200, { "Content-Type": mime.contentType(mimeType), "Cache-Control": cacheControlStr });
        }else if(mimeType == "bin"){
            res.writeHead(200, { "Content-Type": 'application/octet-stream', "Cache-Control": cacheControlStr });
        }
        else {
            res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": cacheControlStr });
        }
        res.write(b)
        res.end()
        return
    }
    catch (err) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(err)
        return
    }


    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("org: " + org
        + "\nproject: " + project
        + "\nrepo: " + repo
        + "\nbranch: " + branch
        + "\npath: " + remainder
        + "\nisListing: " + isListing
        + "\nun: " + login
        + "\npassword: " + password
        + "\n" + str
        + "\n");
}


// for root page send rootpage url
app.get('/', (req, res) => {
    const fileDirectory = __dirname + "/" ;
    res.sendFile('rootpage.html', {root: fileDirectory}, (err) => {
      res.end();
  
      if (err) throw(err);
    });
  })

/**
 * @param {string} remainder
 */
async function isFolder(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW) {
    if (remainder.includes(".")) {
        return false;
    }

    var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/git/repositories/" + repo + "/items?path=" + remainder + "&$format=json&versionDescriptor.version=" + branch + "&versionDescriptor.versionType="+ versionType + "&api-version=5.0"

    console.log(str)
    console.log("\n")

    try {
        var data = await fetch(str)
        b = await data.buffer()
        // console.log(b)

        try {
            obj = JSON.parse(b.toString('utf8'))
            return obj.gitObjectType == "tree"
        } catch (error) {
            return false
        }

    }
    catch (err) {
        return false
    }

}

/**
 * @param {string} remainder
 */
async function listFolder(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW) {

    var str = "https://" + unPW + "dev.azure.com/" + org + "/" + project + "/_apis/git/repositories/" + repo + "/items?scopePath=" + remainder + "&recursionLevel=oneLevel&includeContentMetadata=true&versionDescriptor.version=" + branch + "&versionDescriptor.versionType="+ versionType + "&api-version=5.0"

    console.log(str)
    console.log("\n")

    try {
        var data = await fetch(str)
        b = await data.buffer()
        // console.log(b)

        try {
            obj = JSON.parse(b.toString('utf8'))
            var objects = {
                folders: [],
                files: []
            }
            obj.value.forEach(function (ob, index) {
                if (index == 0) {
                    return;
                }
                if (ob.gitObjectType == "tree") {
                    objects.folders.push(ob.path)
                } else {
                    objects.files.push(ob.path)
                }
            });
            return objects
        } catch (error) {
            return {
                folders: [],
                files: []
            }
        }

    }
    catch (err) {
        return {
            folders: [],
            files: []
        }
    }

}

function writeList(response, baseUrl, remainder, folders, files) {
    response.writeHeader(200, { "Content-Type": "text/html", "Cache-Control": cacheControlStr });
    var data = `  <table><tr>
    <th>View Txt</th>
    <th>Download</th> 
    <th>Normal Website (correct mime-type)</th>
  </tr> 
  <tr>
  `
  // add current page
  data = data + '<tr>'
  data = data + '<td><a href="' + '/raw'+ baseUrl + remainder + '">txt</a></td>'
  data = data + '<td></td>'
  data = data + '<td><a href="' + baseUrl + remainder + '">' + remainder + '</a></td>'
  data = data + '</tr>\n'
  if(remainder != '/'){

    // add parent page
    data = data + '<tr>'
    data = data + '<td><a href="' + '/raw'+ baseUrl + remainder + '../' + '">txt</a></td>'
    data = data + '<td></td>'
    data = data + '<td><a href="' + baseUrl + remainder+ '../'+ '">' + remainder + '</a></td>'
    data = data + '</tr>\n'
  }

    folders.forEach(function (folder, index) {
        data = data + '<tr>'
        data = data + '<td><a href="' + '/raw'+ baseUrl + folder + "/" + '">txt</a></td>'
        data = data + '<td></td>'
        data = data + '<td><a href="' + baseUrl + folder + "/" + '">' + folder + '</a></td>'
        data = data + '</tr>\n'

    });
    files.forEach(function (file, index) {
        data = data + '<tr>'
        data = data + '<td><a href="' + '/raw'+ baseUrl + file + '">txt</a></td>'
        data = data + '<td><a href="' + '/bin' +baseUrl + file + '">bin</a></td>'
        data = data + '<td><a href="' + baseUrl + file+ '">' + file + '</a></td>'
        data = data + '</tr>\n'
    });
    let htmlPrefix = `<html><head>
    <style>
      table,
      th,
      td {
        border: 1px solid black;
        border-collapse: collapse;
      }
    </style></head><body>
    `
    response.write(htmlPrefix + data + "</table></body></html>");
    response.end();
}

async function processRequest(req, res, mimeType) {

    // // var needsAuth = req.params.needsAuth;
    // const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    // const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')
    // // console.log(req.originalUrl)
    // // lets make it always require token
    // // TODO: figure out how to make it not always require token
    // if (b64auth == '') {
    //     res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
    //     return res.status(401).send("Authorization Required");
    // }

    var token = req.params.token;
    var login = token;
    var org = req.params.organization;
    var repo = req.params.repo;
    var project = req.params.project;
    var branch = encodeURIComponent(req.params.branch);
    var remainder = req.path;
    var versionType = req.params.versionType

    var isListing = req.originalUrl[req.originalUrl.length - 1] == '/'
    var baseUrl = '/' + token + '/' + versionType + '/' + org +'/' + project + '/' + repo + '/' + branch
    var unPW = ''
    if (login != '') {
        unPW = "empty:" + login + "@"
    }
    // if (await isFolder(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW)) {
    if (isListing) {
        var objects = await listFolder(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW)
        console.log(objects)

        if(mimeType != "normal"){
            writeList(res, baseUrl, remainder, objects.folders, objects.files) 
        }else{
            // search for index.htm(l)
            let indexHtml = -1;
            for(var i =0; i<objects.files.length; i++){
                let filePath = objects.files[i].toLowerCase()
                let filePathChunked = filePath.split('/')
                let fileName = filePathChunked[filePathChunked.length -1]
                if(fileName == "index.html" || fileName == "index.htm"){
                    indexHtml = i;
                    break;
                }
            }
            if(indexHtml != -1){
                await serveFile(req, res, versionType, org, repo, project, branch, objects.files[indexHtml], isListing, unPW, mimeType)
            }
            else{
                writeList(res, baseUrl, remainder, objects.folders, objects.files)
            }
        }
    }
    else {
        await serveFile(req, res, versionType, org, repo, project, branch, remainder, isListing, unPW, mimeType)
    }
}
app.use('/raw/:token/:versionType/:organization/:project/:repo/:branch/', async function (req, res) {
    console.log("I am raw")
    await processRequest(req, res,'raw')
});
app.use('/bin/:token/:versionType/:organization/:project/:repo/:branch/', async function (req, res) {
    console.log("I am bin")
    await processRequest(req, res,'bin')
});
app.use('/:token/:versionType/:organization/:project/:repo/:branch/', async function (req, res) {
    console.log("I am website")
    await processRequest(req, res,'normal')
});


let server = app.listen(8080, function () {
    console.log('Server is listening on port 8080')
});