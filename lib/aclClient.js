const rdf = require("rdflib");
const {
  read,
  readAgentsAndAccess,
  readAccess,
  readAgents,
  readAgentGroups
} = require("./read.js");

function aclClient(resource, body = null) {
  this.resource = resource;
  this.graph = rdf.graph();
  this.body = !body
    ? null
    : rdf.parse(body, this.graph, this.resource, "text/turtle");
  this.fetcher = new rdf.Fetcher(this.graph);
  this.read = read;
  this.readAgentsAndAccess = readAgentsAndAccess;
  this.readAgents = readAgents;
  this.readAgentGroups = readAgentGroups;
  this.readAccess = readAccess;
}

module.exports = aclClient;
