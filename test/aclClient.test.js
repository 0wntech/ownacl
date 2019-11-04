const { expect } = require("chai");
const aclClient = require("../index");

describe("aclClient", () => {
  it("initiates with the resource that is given", () => {
    const resource = "blabla";
    const acl = new aclClient(resource);
    expect(acl.resource).to.equal(resource);
  });
});
