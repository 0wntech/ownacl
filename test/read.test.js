const { expect } = require("chai");
const { SolidNodeClient } = require("solid-node-client");
const fs = require("fs");
const config = require("dotenv").config();
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/";
const acl = new aclClient(resource);
const altAcl = new aclClient(resource.replace("profile", "public"));

describe("read", () => {
  before("Setting up auth...", async () => {
    const client = new SolidNodeClient();
    await client.login(config);
    acl.fetcher._fetch = client.session.fetch.bind(client);
    altAcl.fetcher._fetch = client.session.fetch.bind(client);
  });

  describe("read()", () => {
    it("fetches and reads the resource", () => {
      return acl.read().then((triples) => {
        return fs.promises
          .readFile("./test/resources/profile.acl", "utf-8")
          .then((file) => {
            expect(triples).to.equal(file);
          });
      });
    });

    it("fetches and reads the resource from a default location", () => {
      return altAcl.read().then((triples) => {
        return fs.promises
          .readFile("./test/resources/root.acl", "utf-8")
          .then((file) => {
            expect(triples).to.equal(file);
          });
      });
    });
  });

  describe("readAccessControl()", () => {
    it("reads and returns agents and their access", () => {
      accesseesToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
          access: ["http://www.w3.org/ns/auth/acl#Read"],
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
          access: [
            "http://www.w3.org/ns/auth/acl#Control",
            "http://www.w3.org/ns/auth/acl#Read",
            "http://www.w3.org/ns/auth/acl#Write",
          ],
        },
      ];
      return acl.readAccessControl().then((accessees) => {
        expect(accessees).to.deep.equal(accesseesToMatch);
      });
    });
  });

  describe("readEntities()", () => {
    it("reads and returns agents", () => {
      agentsToMatch = [
        {
          name: "http://xmlns.com/foaf/0.1/Agent",
          type: "AgentGroup",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#Read",
        },
        {
          name: "https://lalatest.solidcommunity.net/profile/card#me",
          type: "Agent",
          identifier: "https://lalatest.solidcommunity.net/profile/.acl#ControlReadWrite",
        },
      ];
      return acl.readEntities().then((agents) => {
        expect(agents).to.deep.equal(agentsToMatch);
      });
    });
  });

  describe("readAccess()", () => {
    it("reads and returns the access of an identifier", () => {
      accessToMatch = ["http://www.w3.org/ns/auth/acl#Read"];
      return acl
        .readAccess("https://lalatest.solidcommunity.net/profile/.acl#Read")
        .then((access) => {
          return expect(access).to.deep.equal(accessToMatch);
        });
    });

    it("reads and returns the access of an agent identifier", () => {
      accessToMatch = ["http://www.w3.org/ns/auth/acl#Read"];
      return acl
        .readAccess("http://xmlns.com/foaf/0.1/Agent")
        .then((access) => {
          return expect(access).to.deep.equal(accessToMatch);
        });
    });
  });
});
