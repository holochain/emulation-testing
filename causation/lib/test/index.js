"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tape = require("tape");
var waiter_1 = require("../src/waiter");
var network_1 = require("../src/network");
var agents = ['autumn', 'mara', 'jill'];
var testCommit = {
    action_type: 'commit',
};
var testHold = {
    action_type: 'hold',
};
tape('x', function (t) {
    var network = new network_1.FullSyncNetwork(agents);
    var waiter = new waiter_1.Waiter(network);
    waiter.handleObservation({
        agent: 'autumn',
        action: testCommit
    });
    waiter.handleObservation({
        agent: 'mara',
        action: testHold,
    });
    waiter.handleObservation({
        agent: 'jill',
        action: testHold,
    });
    t.equal(waiter.pendingEffects.length, 1);
});
//# sourceMappingURL=index.js.map