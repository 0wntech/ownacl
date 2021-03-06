const { expect } = require("chai");
const { login } = require("../utils");
const aclClient = require("../index");

const resource = "https://lalatest.solidcommunity.net/profile/.acl";
const acl = new aclClient(resource);
let originalState = null;
const testOrigins = [
  {
    name: "https://drive.owntech.io/",
    type: "Origin",
    access: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Write",
    ],
  },
  {
    name: "https://chat.owntech.io/",
    type: "Origin",
    access: ["http://www.w3.org/ns/auth/acl#Read"],
  },
];

describe("deleting an Origin", () => {
  before("Setting up auth...", async function () {
    this.timeout(5000);
    return login().then((nodeClient) => {
      acl.fetcher._fetch = nodeClient.session.fetch.bind(nodeClient);
      return acl
        .readAccessControl()
        .then((entities) => {
          originalState = entities;
        })
        .then(() => {
          return acl.addOrigin(testOrigins[0]);
        });
    });
  });

  describe("deleteOrigin()", () => {
    it("deletes an origin", () => {
      return acl.deleteOrigin({ name: testOrigins[0].name }).then(() => {
        return acl.readAccessControl({ force: true }).then((agents) => {
          return expect(agents).to.deep.equal(originalState);
        });
      });
    });

    it("deletes an origin from an existing identifier", () => {
      return acl.addOrigin(testOrigins[1]).then(() => {
        return acl
          .deleteOrigin(testOrigins[1].name, {
            debug: true,
          })
          .then(() => {
            return acl.readAccessControl({ force: true }).then((agents) => {
              return expect(agents).to.deep.equal(originalState);
            });
          });
      });
    });
  });
});
