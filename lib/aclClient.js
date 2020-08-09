const rdf = require("rdflib");
const {
  read,
  readAccessControl,
  readAccess,
  readEntities,
} = require("./read.js");
const { addAgent, addAgentGroup, addOrigin } = require("./add.js");
const { deleteAgent, deleteAgentGroup, deleteOrigin } = require("./delete.js");

function AclClient(resource, body = null) {
  this.resource = resource.endsWith(".acl")
    ? resource.substr(0, resource.lastIndexOf(".acl"))
    : resource;
  this.graph = rdf.graph();
  this.body = !body
    ? null
    : rdf.parse(body, this.graph, this.aclResource, "text/turtle");
  this.fetcher = new rdf.Fetcher(this.graph);
  this.updater = new rdf.UpdateManager(this.graph);

  this.read = read;
  this.readAccessControl = readAccessControl;
  this.readEntities = readEntities;
  this.readAccess = readAccess;

  this.addAgent = addAgent;
  this.addAgentGroup = addAgentGroup;
  this.addOrigin = addOrigin;

  this.deleteOrigin = deleteOrigin;
  this.deleteAgent = deleteAgent;
  this.deleteAgentGroup = deleteAgentGroup;
}

module.exports = AclClient;
