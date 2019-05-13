"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Specifies which group of agents the Effect affects
 * - Self: The agent who produced the corresponding Cause
 * - Validators: All validators associated with the Cause
 */
var EffectGroup;
(function (EffectGroup) {
    EffectGroup[EffectGroup["Self"] = 0] = "Self";
    EffectGroup[EffectGroup["Validators"] = 1] = "Validators";
})(EffectGroup = exports.EffectGroup || (exports.EffectGroup = {}));
//# sourceMappingURL=elements.js.map