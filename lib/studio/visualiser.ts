import MultiGraph from "graphology";
import {TypeDBRowsResult} from "../typedb/answer.js";
import {constructGraphFromRowsResult} from "../graph.js";
import {convertLogicalGraphWith} from "../visualisation.js";
import {StudioConverter} from "./converter.js";
import * as studioDefaultSettings from "./defaults.js";

export class StudioVisualiser {
    private graph: MultiGraph;
    constructor(graph: MultiGraph) {
        this.graph = graph;
    }

    handleQueryResult(query_result: TypeDBRowsResult) {
        if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
            let converter = new StudioConverter(this.graph, query_result.queryStructure, false, studioDefaultSettings.defaultStructureParameters, studioDefaultSettings.defaultQueryStyleParameters);
            let logicalGraph = constructGraphFromRowsResult(query_result); // In memory, not visualised
            this.graph.clear();
            convertLogicalGraphWith(logicalGraph, converter);
        }
    }

    handleExplorationQueryResult(query_result: TypeDBRowsResult) {
        if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
            let converter = new StudioConverter(this.graph, query_result.queryStructure, true, studioDefaultSettings.defaultStructureParameters, studioDefaultSettings.defaultExplorationQueryStyleParameters);
            let logicalGraph = constructGraphFromRowsResult(query_result); // In memory, not visualised
            convertLogicalGraphWith(logicalGraph, converter);
        }
    }
}
