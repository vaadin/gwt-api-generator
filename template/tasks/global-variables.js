var args = require('minimist')(process.argv.slice(2));

var ns = args.groupId || "com.vaadin.polymer";
var nspath = ns.replace(/\./g,'/');
var currentDir = process.cwd() + '/';

var clientDirBase = currentDir + (args.javaDir || 'src/main/java/').replace(/,+$/, "");
var publicDirBase = currentDir + (args.resourcesDir || 'src/main/resources/').replace(/,+$/, "");

var clientDir = clientDirBase + '/' + nspath + "/";
var publicDir = publicDirBase + '/' + nspath + "/public/";
var bowerDirName = "bower_components";

module.exports = {
  ns: ns,
  nspath: nspath,
  artifactId: args.artifactId || "gwt-polymer-elements",
  currentDir: currentDir,
  clientDirBase: clientDirBase,
  publicDirBase: publicDirBase,
  clientDir: clientDir,
  publicDir: publicDir,
  bowerDirCwd: "./" + bowerDirName,
  bowerDir: publicDir + bowerDirName + "/",
  bowerPackages: (args.package || 'PolymerElements/paper-elements').split(/[, ]+/)
};



