import Sigma from "sigma";
import MultiGraph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";

import * as studioDefaultSettings from "./defaults";
import {StudioInteractionHandler} from "./interaction";
import {StudioDriverWrapper} from "./driverwrapper.js";
import {StudioVisualiser} from "./visualiser.js";
import {TypeDBAnswerAny, TypeDBQueryType} from "../typedb/answer.js";
import {TypeDBResult} from "../typedb/driver.js";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import {LayoutWrapper} from "./layouts.js";
import chroma from "chroma-js";

export interface StudioState {
    activeQueryDatabase: string | null;
}

export class TypeDBStudio {
    graph: MultiGraph;
    renderer: Sigma;
    layout:  LayoutWrapper;
    interactionHandler: StudioInteractionHandler;
    visualiser: StudioVisualiser;
    driver: StudioDriverWrapper;
    state: StudioState;

    constructor(graph: MultiGraph, renderer: Sigma, layout: LayoutWrapper) {
        this.graph = graph;
        this.renderer = renderer;
        this.layout = layout;
        this.layout.start();

        this.state = { activeQueryDatabase: null };

        this.visualiser = new StudioVisualiser(graph);
        this.driver = new StudioDriverWrapper(this.visualiser);
        this.interactionHandler = new StudioInteractionHandler(graph, renderer, this.driver, this.state, studioDefaultSettings.defaultQueryStyleParameters);
    }

    runQuery(database: string, query: string, transactionType: TypeDBQueryType) : Promise<TypeDBResult<TypeDBAnswerAny>> {
        return this.driver.runQuery(database, query, transactionType).then(result => {
           if (result.ok) {
               this.state.activeQueryDatabase = database;
           }
           return result;
        });
    }

    searchGraph(term: string) {

        function safe_str(str: string | undefined): string {
            return (str == undefined) ? "" : str.toLowerCase();
        }

        this.graph.nodes().forEach(node => this.graph.setNodeAttribute(node, "highlighted", false));
        if (term != "") {
            this.graph.nodes().forEach(node => {
                let attributes = this.graph.getNodeAttributes(node);
                // check concept.type.label if you want to match types of things.
                let any_match = -1 != safe_str(attributes.metadata.concept.iid).indexOf(term)
                    || -1 != safe_str(attributes.metadata.concept.label).indexOf(term)
                    || -1 != safe_str(attributes.metadata.concept.value).indexOf(term);
                if (any_match) {
                    this.graph.setNodeAttribute(node, "highlighted", true);
                }
            });
        }
    }

    colorEdgesByConstraintIndex(reset: boolean): void {
        function getColorForConstraintIndex(graph: MultiGraph, edgeKey: string): chroma.Color {
            let attributes = graph.getEdgeAttributes(edgeKey);
            let constraintIndex = attributes.metadata.structureEdgeCoordinates.constraintIndex;
            let r = ((constraintIndex+1) * 153 % 256);
            let g = ((constraintIndex+1) * 173 % 256);
            let b = ((constraintIndex+1) * 199 % 256);
            return chroma([r,g,b]);
        }

        this.graph.edges().forEach(edgeKey => {
            let color = reset ?
                this.interactionHandler.styleParameters.edge_color :
                getColorForConstraintIndex(this.graph, edgeKey);
            this.graph.setEdgeAttribute(edgeKey, "color", color.hex());
        })
    }
}
