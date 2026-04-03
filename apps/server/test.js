"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = void 0;
const ai_1 = require("ai");
const zod_1 = require("zod");
exports.t = (0, ai_1.tool)({
    parameters: zod_1.z.object({ to: zod_1.z.string().email() }),
    execute: async ({ to }) => { return { success: true }; },
});
