import { ConceptAny, TypeAny, RoleType, TypeDBValue, UnavailableKind } from "./concept";
import { LogicalGraph, LogicalEdge, LogicalVertex, LogicalVertexID, VertexMap, VertexUnavailable, EdgeKind, LogicalEdgeType } from "./graph";
import { TypeDBQueryStructure } from "./querystructure";

// For common data-structures that convert between what the server gives us and what we need
export type TypeDBRowsResult = {
    queryType: string,
    answers: Array<TypeDBRow>,
    queryStructure: TypeDBQueryStructure,
    answerType: string,
}


// Answers:
export type TypeDBRow = { data: TypeDBRowData, provenance: number }
export type TypeDBRowData = { [id: string] : ConceptAny };
