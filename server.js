var express = require('express')
var app = express()

// get the port number from the command line args
const port = (process.argv.length > 2) ? process.argv[2] : 3000

console.log("Starting server on port " + port)

var server = app.listen(port)
app.use(express.static('public'))
