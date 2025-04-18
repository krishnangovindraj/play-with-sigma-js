import Graph from "graphology";
import {TypeDBRowsResult} from "../typedb/answer.js";
import {constructGraphFromRowsResult} from "../graph.js";
import {convertLogicalGraphWith} from "../visualisation.js";
import {StudioConverter} from "./converter.js";
import * as studioDefaultSettings from "./defaults.js";

export class StudioVisualiser {
    private graph: Graph;
    constructor(graph: Graph) {
        this.graph = graph;
    }

    handleQueryResult(query_result: TypeDBRowsResult) {
        if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
            let converter = new StudioConverter(this.graph, query_result.queryStructure, studioDefaultSettings.defaultStructureParameters, studioDefaultSettings.defaultStyleParameters);
            let logicalGraph = constructGraphFromRowsResult(query_result); // In memory, not visualised
            this.graph.clear();
            convertLogicalGraphWith(logicalGraph, converter);
        }
    }
}
