"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Waiter = /** @class */ (function () {
    function Waiter(networkModel) {
        this.pendingEffects = [];
        this.completedObservations = [];
        this.networkModel = networkModel;
        this.startTime = Date.now();
        this.complete = new Promise(function (resolve, reject) {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    Waiter.prototype.handleObservation = function (o) {
        var agent = o.agent, action = o.action;
        this.consumeObservation(o);
        this.expandObservation(o);
    };
    Waiter.prototype.consumeObservation = function (o) {
        var _this = this;
        var wasNotEmpty = this.pendingEffects.length > 0;
        this.pendingEffects = this.pendingEffects.filter(function (_a) {
            var predicate = _a.predicate, agents = _a.agents;
            var matches = predicate(o.action) && agents.includes(o.agent);
            if (matches) {
                // big ol' side effect in a filter, but it works
                _this.completedObservations.push({
                    observation: o,
                    stats: {
                        timestamp: Date.now()
                    }
                });
            }
            return !matches;
        });
        if (wasNotEmpty && this.pendingEffects.length === 0) {
            this._resolve(this.completedObservations);
        }
    };
    Waiter.prototype.expandObservation = function (o) {
        var effects = this.networkModel.determineEffects(o);
        this.pendingEffects.concat(effects);
    };
    return Waiter;
}());
exports.Waiter = Waiter;
//# sourceMappingURL=waiter.js.map