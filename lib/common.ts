import { ConceptAny } from "./concept";
import { TypeDBQueryStructure } from "./querystructure";
// For common data-structures that convert between what the server gives us and what we need

///////////
// QUERY //
///////////
export type TypeDBQueryResponse = {
    queryType: string,
    answerType: TypeDBQueryAnswerType,
    answers: Array<TypeDBRow | TypeDBDocument>,
    queryStructure: TypeDBQueryStructure,
}

enum TypeDBQueryType {
    schema = "schema",
    write = "write",
    read = "read",
}

enum TypeDBQueryAnswerType {
    ok = "ok",
    conceptRows = "conceptRows",
    conceptDocuments = "conceptDocuments",
}

// Answers:
export type TypeDBRow = { data: TypeDBRowData, provenance: number }
export type TypeDBRowData = { [id: string] : ConceptAny };

export type TypeDBDocument = any;
