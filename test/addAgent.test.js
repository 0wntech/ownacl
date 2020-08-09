const { expect } = require("chai");
const auth = require("solid-auth-cli");
const rdf = require("rdflib");
const PodClient = require("ownfiles");
const aclClient = require("../index");

const resource = "https://lalasepp1.solid.community/profile/.acl";
const acl = new aclClient(resource);
const podClient = new PodClient();

describe("adding an Agent", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    return auth.getCredentials().then((credentials) => {
      return auth.login(credentials).then(() => {
        acl.fetcher = new rdf.Fetcher(acl.graph, {
          fetch: auth.fetch,
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
          "http://www.w3.org/ns/auth/acl#Write",
        ],
      };
      const agentsToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
        agentToAdd,
      ];
      return acl.addAgent(agentToAdd).then(() => {
        return acl.readAccessControl().then((agents) => {
          return expect(agents).to.deep.equal(agentsToMatch);
        });
      });
    });

    it("adds an agent to an existing identifier", () => {
      const agentToAdd = {
        name: "https://ludwig.owntech.de/profile/card#me",
        type: "Agent",
        access: ["http://www.w3.org/ns/auth/acl#Read"],
      };
      const agentsToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalasepp1.solid.community/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalasepp1.solid.community/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalasepp1.solid.community/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
        agentToAdd,
      ];
      return acl.addAgent(agentToAdd).then(() => {
        return acl.readAccessControl().then((agents) => {
          return expect(agents).to.deep.equal(agentsToMatch);
        });
      });
    });

    it("adds an agent to a new acl file", async () => {
      const testFile = "https://lalasepp1.solid.community/test.txt";
      await podClient.create(testFile, { contents: "lala" });
      const newAcl = new aclClient(testFile);
      const agentToAdd = {
        name: "https://ludwig.owntech.de/profile/card#me",
        type: "Agent",
        access: ["http://www.w3.org/ns/auth/acl#Read"],
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
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
        agentToAdd,
      ];
      await newAcl.addAgent(agentToAdd);
      const agents = await newAcl.readAccessControl();
      expect(newAcl.defaultAclResource).to.be.undefined;
      expect(agents[0].identifier.includes(newAcl.aclResource)).to.be.true;
      expect(agents).to.deep.equal(agentsToMatch);
    });
  });

  after("Cleaning up", async () => {
    await podClient.delete("https://lalasepp1.solid.community/test.txt");
    const addedAgent = {
      name: "https://ludwig.owntech.de/profile/card#me",
      type: "Agent",
      access: ["http://www.w3.org/ns/auth/acl#Read"],
    };
    return await acl.deleteAgent(addedAgent);
  });
});
