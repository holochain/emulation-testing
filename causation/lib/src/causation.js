"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var elements_1 = require("./elements");
var cause = function (predicate) { return ({ predicate: predicate }); };
var effect = function (group) {
    return function (predicate) { return ({ predicate: predicate, group: group }); };
};
var causations = [
    [
        cause(function (action) { return action.action_type === 'commit'; }),
        [
            effect(elements_1.EffectGroup.Validators)(function (action) { return action.action_type === 'hold'; })
        ]
    ]
];
exports.resolveCause = function (action) {
    return causations
        .filter(function (_a) {
        var cause = _a[0], _ = _a[1];
        var match = cause.predicate(action);
    })
        .map(function (_, effects) { return effects; })
        .flat();
};
//# sourceMappingURL=causation.js.map