const rdf = require("rdflib");
const {
  read,
  readAgentsAndAccess,
  readAccess,
  readAgents,
  readAgentGroups
} = require("./read.js");
const { addAgent, addAgentGroup } = require("./add.js");
const { deleteAgent } = require("./delete.js");

function aclClient(resource, body = null) {
  this.resource = resource;
  this.graph = rdf.graph();
  this.body = !body
    ? null
    : rdf.parse(body, this.graph, this.resource, "text/turtle");
  this.fetcher = new rdf.Fetcher(this.graph);
  this.updater = new rdf.UpdateManager(this.graph);

  this.read = read;
  this.readAgentsAndAccess = readAgentsAndAccess;
  this.readAgents = readAgents;
  this.readAgentGroups = readAgentGroups;
  this.readAccess = readAccess;

  this.addAgent = addAgent;
  this.addAgentGroup = addAgentGroup;
  this.deleteAgent = deleteAgent;
}

module.exports = aclClient;
