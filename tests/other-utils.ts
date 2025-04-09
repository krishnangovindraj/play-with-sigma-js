import {StructureEdge, StructureVertex, StructureVertexKind} from "../lib/typedb/answer.js";
import {EdgeKind} from "../lib/typedb/concept.js";

export class StructureHelper {
    static edge(kind: EdgeKind, from: StructureVertex, to: StructureVertex, param: any | null): StructureEdge {
        return { type: {kind: kind, param: param},  from: from, to: to };
    }

    static var(variable: string) : StructureVertex {
        return { kind: StructureVertexKind.variable, value: { variable: variable } };
    }
}