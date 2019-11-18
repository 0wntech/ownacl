const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);

describe("adding an AgentGroup", () => {
  before("Setting up auth...", async function() {
    this.timeout(5000);
    return auth.getCredentials().then(credentials => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch
        });
      });
    });
  });

  describe("addAgentGroup()", () => {
    it("adds agentGroups with the specified access", () => {
      const agentGroup = {
        name: "http://xmlns.com/foaf/0.1/Agent",
        type: "AgentGroup",
        access: ["Read", "Write"]
      };
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
        agentGroup
      ];
      return acl.addAgentGroup(agentGroup).then(() => {
        return acl.readAgentsAndAccess().then(accessees => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });

    it("adds agentGroups and deletes old Access", () => {
      const agentGroup = {
        name: "http://xmlns.com/foaf/0.1/Agent",
        type: "AgentGroup",
        access: ["Read"]
      };
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
        agentGroup
      ];
      return acl.addAgentGroup(agentGroup).then(() => {
        return acl.readAgentsAndAccess().then(accessees => {
          return expect(accessees).to.deep.equal(accesseesToMatch);
        });
      });
    });
  });
});
