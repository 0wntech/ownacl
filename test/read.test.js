const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const fs = require("fs");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);

describe("read", () => {
  before("Setting up auth...", async function() {
    this.timeout(3000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
      });
    });
  });

  describe("read()", () => {
    it("fetches and reads the resource", () => {
      return acl.read().then(triples => {
        fs.promises
          .readFile("./test/resources/test.acl", "utf-8")
          .then(file => {
            expect(triples).to.equal(file);
          });
      });
    });
  });

  describe("readAgentsAndAccess()", () => {
    it("reads and returns agents and their access", () => {
      accesseesToMatch = [
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write"
          ]
        },
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.readAgentsAndAccess().then(accessees => {
        expect(accessees).to.deep.equal(accesseesToMatch);
      });
    });
  });

  describe("readAgents()", () => {
    it("reads and returns agents", () => {
      agentsToMatch = [
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite"
        }
      ];
      return acl.readAgents().then(agents => {
        expect(agents).to.deep.equal(agentsToMatch);
      });
    });
  });

  describe("readAgentGroups()", () => {
    it("reads and returns agent groups", () => {
      agentGroupsToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read"
        }
      ];
      return acl.readAgentGroups().then(agentGroups => {
        expect(agentGroups).to.deep.equal(agentGroupsToMatch);
      });
    });
  });
});
