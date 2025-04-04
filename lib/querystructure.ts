import {TypeAny, TypeDBValue, EdgeKind, ThingKind} from "./concept"

/////////////////////
// Query structure //
/////////////////////
export type TypeDBQueryStructure = { branches: Array<{ edges: Array<StructureEdge> }> };

export type StructureEdge = { 
    type: StructureEdgTypeAny,
    to: StructureVertex,
    from: StructureVertex,
};
export type StructureEdgTypeAny = { kind: EdgeKind, param: StructureVertex | null };

// Vertex
export type StructureVertex = {
    kind: StructureVertexKind,
    value: StructureVertexAny,
}
export type StructureVertexVariable = { variable: string };
export type StructureVertexLabel = {  kind: ThingKind, label: string }; // Unfortunate that it's ThingKind
export type StructureVertexValue = TypeDBValue; // { value_type: TypeDBValueType, value: any };
export type StructureVertexUnavailable = null;
export type StructureVertexAny = StructureVertexVariable | StructureVertexUnavailable | StructureVertexLabel | StructureVertexValue;

export enum StructureVertexKind {
    variable = "variable",
    label = "label",
    value = "value",
    unavailable = "unavailableVariable",
}
