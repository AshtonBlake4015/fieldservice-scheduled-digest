import assert from "node:assert/strict";
import {buildDigest, workOrder} from "./digest.js";

const orders = [
  workOrder.parse({id: "WO-1", site: "A", status: "dispatched", followUp: true}),
  workOrder.parse({id: "WO-2", site: "B", status: "complete", followUp: true})
];
assert.equal(buildDigest(orders), "WO-1 | A | dispatched");
assert.equal(buildDigest([orders[1]]), null);
console.log("digest decision: only open follow-ups are mailed");
