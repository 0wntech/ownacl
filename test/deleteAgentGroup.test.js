const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);
let originalState = null;
const testAgentGroups = [
  {
    name: "http://xmlns.com/foaf/0.1/Account",
    type: "AgentGroup",
    access: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Write"
    ]
  },
  {
    name: "http://www.w3.org/ns/solid/terms#Account",
    type: "AgentGroup",
    access: ["http://www.w3.org/ns/auth/acl#Read"]
  }
];

describe("deleting an AgentGroup", () => {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
        return acl
          .readAccessControl()
          .then(agents => {
            originalState = agents;
          })
          .then(() => {
            return acl.addAgentGroup(testAgentGroups[0]);
          });
      });
    });
  });

  describe("deleteAgentGroup()", () => {
    it("deletes an agent group", () => {
      return acl
        .deleteAgentGroup({ name: testAgentGroups[0].name })
        .then(() => {
          return acl.readAccessControl({ force: true }).then(agents => {
            return expect(agents).to.deep.equal(originalState);
          });
        });
    });

    it("deletes an agent group from an existing identifier", () => {
      return acl.addAgentGroup(testAgentGroups[1]).then(() => {
        return acl
          .deleteAgentGroup(testAgentGroups[1].name, {
            debug: true
          })
          .then(() => {
            return acl.readAccessControl({ force: true }).then(agents => {
              return expect(agents).to.deep.equal(originalState);
            });
          });
      });
    });
  });
});
