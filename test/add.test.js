const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const fs = require("fs");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);

describe("add", () => {
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

  describe("addAgent()", () => {
    it("adds an agent with the specified access", () => {
      const agentToAdd = {
        name: "https://ludwig.owntech.de/profile/card#me",
        type: "Agent",
        access: [
          "http://www.w3.org/ns/auth/acl#Read",
          "http://www.w3.org/ns/auth/acl#Write"
        ]
      };
      const agentsToMatch = [
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
        agentToAdd,
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.addAgent(agentToAdd).then(agents => {
        return expect(agents).to.deep.equal(agentsToMatch);
      });
    });

    it("adds an agent to an existing identifier", () => {
      const agentToAdd = {
        name: "https://ludwig.owntech.de/profile/card#me",
        type: "Agent",
        access: ["http://www.w3.org/ns/auth/acl#Read"]
      };
      const agentsToMatch = [
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
        agentToAdd,
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"]
        }
      ];
      return acl.addAgent(agentToAdd).then(agents => {
        return expect(agents).to.deep.equal(agentsToMatch);
      });
    });
  });

  describe("addAgentGroup()", () => {
    xit("adds agentGroups with the specified access", () => {
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

  after("Cleaning up", () => {
    const addedAgent = {
      name: "https://ludwig.owntech.de/profile/card#me",
      type: "Agent",
      access: ["http://www.w3.org/ns/auth/acl#Read"]
    };

    return acl.deleteAgent(addedAgent);
  });
});
