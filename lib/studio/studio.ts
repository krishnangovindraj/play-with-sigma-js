import Sigma from "sigma";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";

import * as studioDefaultSettings from "./defaults";
import {StudioInteractionHandler} from "./interaction";
import {StudioDriverWrapper} from "./driverwrapper.js";
import {StudioVisualiser} from "./visualiser.js";
import {TypeDBAnswerAny, TypeDBQueryType} from "../typedb/answer.js";
import {TypeDBResult} from "../typedb/driver.js";

export interface StudioState {
    activeQueryDatabase: string | null;
}

export class TypeDBStudio {
    graph: Graph;
    renderer: Sigma;
    layout:  ForceSupervisor;
    interactionHandler: StudioInteractionHandler;
    visualiser: StudioVisualiser;
    driver: StudioDriverWrapper;
    state: StudioState;

    constructor(graph: Graph, renderer: Sigma) {
        this.graph = graph;
        this.renderer = renderer;
        this.layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted, settings: studioDefaultSettings.defaultForceSupervisorSettings});
        this.layout.start();

        this.state = { activeQueryDatabase: null };

        this.visualiser = new StudioVisualiser(graph);
        this.driver = new StudioDriverWrapper(this.visualiser);
        this.interactionHandler = new StudioInteractionHandler(graph, renderer, this.driver, this.state, studioDefaultSettings.defaultQueryStyleParameters);
    }

    unfreeze() {
        this.layout.start();
    }

    freeze() {
        this.layout.stop();
    }

    runQuery(database: string, query: string, transactionType: TypeDBQueryType) : Promise<TypeDBResult<TypeDBAnswerAny>> {
        return this.driver.runQuery(database, query, transactionType).then(result => {
           if (result.ok) {
               this.state.activeQueryDatabase = database;
           }
           return result;
        });
    }
}
