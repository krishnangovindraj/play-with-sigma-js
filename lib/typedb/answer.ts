import {ConceptAny, TypeDBValue, EdgeKind, ThingKind} from "./concept"
// For common data-structures that convert between what the server gives us and what we need

///////////
// QUERY //
///////////
export type TypeDBQueryResponse<Answer> = {
    queryType: string,
    answerType: TypeDBQueryAnswerType,
    answers: Array<Answer>,
    queryStructure: TypeDBQueryStructure,
}

export enum TypeDBQueryType {
    schema = "schema",
    write = "write",
    read = "read",
}

export enum TypeDBQueryAnswerType {
    ok = "ok",
    conceptRows = "conceptRows",
    conceptDocuments = "conceptDocuments",
}

// Answers:
export type TypeDBRow = { data: TypeDBRowData, provenance: number }
export type TypeDBRowData = { [id: string] : ConceptAny };
export type TypeDBDocument = any;

export type TypeDBAnswerAny =  TypeDBRow | TypeDBDocument  | null;
export type TypeDBRowsResult = TypeDBQueryResponse<TypeDBRow>;


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
export type StructureVertexLabel = {  kind: ThingKind | "relation:role", label: string }; // Unfortunate that it's ThingKind
export type StructureVertexValue = TypeDBValue; // { value_type: TypeDBValueType, value: any };
export type StructureVertexUnavailable = {  variable: string };
export type StructureVertexAny = StructureVertexVariable | StructureVertexUnavailable | StructureVertexLabel | StructureVertexValue;

export enum StructureVertexKind {
    variable = "variable",
    label = "label",
    value = "value",
    unavailable = "unavailableVariable",
}
