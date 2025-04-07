import Sigma from "sigma";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import {ILogicalGraphConverter} from "../visualisation";
import {StudioConverter} from "./converter";
import {TypeDBQueryStructure} from "../typedb/answer";

import * as studioDefaultSettings from "./defaults";

type StudioEventHandler = {};

export class TypeDBStudio {
    graph: Graph;
    renderer: Sigma;
    layout:  ForceSupervisor;
    eventHandler: StudioEventHandler;

    constructor(graph: Graph, renderer: Sigma) {
        this.graph = graph;
        this.renderer = renderer;
        this.layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted, settings: studioDefaultSettings.defaultForceSupervisorSettings});
        this.layout.start();

        this.eventHandler = {}; // TODO
    }

    unfreeze() {
        this.layout.start();
    } 
    freeze() {
        this.layout.stop();
    }

    createConverter(structure: TypeDBQueryStructure) : ILogicalGraphConverter {
        // TODO: parameters
        return new StudioConverter(this.graph, structure, studioDefaultSettings.defaultStructureParameters, studioDefaultSettings.defaultStyleParameters);
    }
}
