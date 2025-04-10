import {StructureEdge, StructureVertex, StructureVertexKind} from "../lib/typedb/answer";
import {EdgeKind, ThingKind} from "../lib/typedb/concept";

export class StructureHelper {
    static edge(kind: EdgeKind, from: StructureVertex, to: StructureVertex, param: any | null): StructureEdge {
        return { type: {kind: kind, param: param},  from: from, to: to };
    }

    static var(variable: string) : StructureVertex {
        return { kind: StructureVertexKind.variable, value: { variable: variable } };
    }

    static label(typeKindAsThingKind: ThingKind | "relation:role", label: string) : StructureVertex {
        return { kind: StructureVertexKind.label, value: { kind: typeKindAsThingKind, label: label } };
    }

    static expr(repr: string): StructureVertex {
        return { kind: StructureVertexKind.expr, value: { repr: repr } };
    }


    static func(repr: string): StructureVertex {
        return { kind: StructureVertexKind.func, value: { repr: repr } };
    }

    static argument(from: StructureVertex, to: StructureVertex, var_name: string): StructureEdge {
        return { type: {kind: EdgeKind.argument, param: var_name},  from: from, to: to }
    }

    static assigned(from: StructureVertex, to: StructureVertex, var_name: string): StructureEdge {
        return { type: {kind: EdgeKind.assigned, param: var_name},  from: from, to: to }
    }
}
