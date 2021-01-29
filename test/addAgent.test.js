const { expect } = require("chai");
const { login } = require("../utils");
const PodClient = require("ownfiles");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const testFile = "https://lalatest.solidcommunity.net/test.txt";
const acl = new aclClient(resource);
const newAcl = new aclClient(testFile);
const podClient = new PodClient();

describe("adding an Agent", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    const client = await login();
    acl.fetcher._fetch = client.session.fetch.bind(client);
    newAcl.fetcher._fetch = client.session.fetch.bind(client);
    podClient.fetcher._fetch = client.session.fetch.bind(client);
  });

  describe("addAgent()", () => {
    it("adds an agent with the specified access", () => {
      const agentToAdd = {
        name: "https://ludwig.aws.owntech.de/profile/card#me",
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
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
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
        name: "https://ludwig.aws.owntech.de/profile/card#me",
        type: "Agent",
        access: ["http://www.w3.org/ns/auth/acl#Read"],
      };
      const agentsToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier:
            "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
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
      await podClient.create(testFile, { contents: "lala" });
      const agentToAdd = {
        name: "https://ludwig.aws.owntech.de/profile/card#me",
        type: "Agent",
        access: ["http://www.w3.org/ns/auth/acl#Read"],
      };
      const agentsToMatch = [
        {
          access: ["http://www.w3.org/ns/auth/acl#Read"],
          identifier: "https://lalatest.solidcommunity.net/test.txt.acl#public",
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier: "https://lalatest.solidcommunity.net/test.txt.acl#owner",
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
    await podClient.delete("https://lalatest.solidcommunity.net/test.txt");
    const addedAgent = {
      name: "https://ludwig.aws.owntech.de/profile/card#me",
      type: "Agent",
      access: ["http://www.w3.org/ns/auth/acl#Read"],
    };
    return await acl.deleteAgent(addedAgent);
  });
});
