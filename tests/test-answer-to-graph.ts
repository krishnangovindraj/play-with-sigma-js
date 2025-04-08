import {constructGraphFromRowsResult, LogicalGraph, LogicalVertex, LogicalVertexID} from "../lib/graph";
import {StructureVertexKind, TypeDBQueryAnswerType, TypeDBQueryType, TypeDBRowsResult} from "../lib/typedb/answer";
import {EdgeKind} from "../lib/typedb/concept";
import {answerSetsAreEqual, GraphHelper, vertexMapsAreEqual} from "./logical-graph-utils";
import {ConceptHelper} from "./concept-utils";

function checkTranslation(name: string, rows_result: TypeDBRowsResult, expectedLogicalGraph: LogicalGraph) {
    let actualLogicalGraph = constructGraphFromRowsResult(rows_result)
    if (!graphsAreEqual(expectedLogicalGraph, actualLogicalGraph)) {
        throw new Error("Graphs are unequal: " + name);
    }
}


function graphsAreEqual(first: LogicalGraph, second: LogicalGraph ) : boolean {
    return vertexMapsAreEqual(first.vertices, second.vertices)
        && answerSetsAreEqual(first.answers, second.answers);
}

interface AnswerToLogicalGraphTestCase {
    name: string,
    answer: TypeDBRowsResult,
    expectedGraph: LogicalGraph,
}


// Test 1:
const TEST_HAS: AnswerToLogicalGraphTestCase = {
    name: "TestHas",
    answer: {
        queryType: TypeDBQueryType.read,
        answerType: TypeDBQueryAnswerType.conceptRows,
        queryStructure: {
            branches: [
                {
                    edges: [{
                        from: { kind: StructureVertexKind.variable, value: { variable: "owner" } },
                        to:  { kind: StructureVertexKind.variable, value: { variable: "attr" } },
                        type: { kind: EdgeKind.has, param: null },
                    }]
                }
            ]
        },
        answers: [
            {
                provenance: 0,
                data: {
                    "owner": ConceptHelper.entity("owner#1", "owner-type"),
                    "attr": ConceptHelper.attribute("attr-type:attr-value", "attr-type", ConceptHelper.valueString("attr-value"))
                }
            }
        ],
    },

    expectedGraph: {
        vertices: new Map<LogicalVertexID, LogicalVertex>([
            ["owner#1", ConceptHelper.entity("owner#1", "owner-type")],
            ["attr-type:attr-value", ConceptHelper.attribute("attr-type:attr-value", "attr-type", ConceptHelper.valueString("attr-value"))]
        ]),
        answers: [
            [ GraphHelper.simpleEdge(EdgeKind.has, 0, 0, "owner#1", "attr-type:attr-value") ]
        ]
    }
}

// TESTS:
const ALL_TESTS: Array<AnswerToLogicalGraphTestCase> = [
    TEST_HAS
];

export function runAllTests() {
    console.log("START: AnswerToLogicalGraph tests")
    for (let test of ALL_TESTS ) {
        checkTranslation(test.name, TEST_HAS.answer, TEST_HAS.expectedGraph);
        console.log("\t-pass: " + test.name)
    }
    console.log("SUCCESS: AnswerToLogicalGraph tests")
}
