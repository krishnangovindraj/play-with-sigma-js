import {connectToTypeDB, TypeDBHttpDriver, TypeDBResult} from "../typedb/driver";
import {TypeDBAnswerAny, TypeDBQueryType} from "../typedb/answer";
import {StudioVisualiser} from "./visualiser";

export class StudioDriverWrapper {
    driver: TypeDBHttpDriver | null;
    visualiser: StudioVisualiser;
    constructor(visualiser: StudioVisualiser) {
        this.driver = null;
        this.visualiser = visualiser;
    }

    tryConnect(address: string, username: string, password: string) : Promise<TypeDBResult<TypeDBHttpDriver>> {
        this.driver = null;
        return connectToTypeDB(address, username, password).then(result => {
            if (result.ok != undefined) {
                this.driver = result.ok;
            }
            return result;
        });
    }

    createDatabase(database: string) : Promise<TypeDBResult<boolean>> {
        if (this.driver == null) {
            return this.errNotLoggedIn();
        } else {
            return this.driver.createDatabase(database);
        }
    }

    deleteDatabase(database: string) : Promise<TypeDBResult<boolean>> {
        if (this.driver == null) {
            return this.errNotLoggedIn();
        } else {
            return this.driver.deleteDatabase(database);
        }
    }

    runQuery(database: string, query: string, transactionType: TypeDBQueryType) : Promise<TypeDBResult<TypeDBAnswerAny>> {
        if (this.driver == null) {
            return this.errNotLoggedIn();
        } else {
            return this.driver.runQuery(database, query, transactionType).then(result => {
                if (result.ok != undefined) {
                    let query_result = result.ok;
                    if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
                        this.visualiser.handleQueryResult(query_result);
                    }
                }
                return result;
            });
        }
    }

    runExplorationQuery(database: string, query: string, transactionType: TypeDBQueryType) : Promise<TypeDBResult<TypeDBAnswerAny>>  {
        if (this.driver == null) {
            return this.errNotLoggedIn();
        } else {
            return this.driver.runQuery(database, query, transactionType).then(result => {
                if (result.ok != undefined) {
                    let query_result = result.ok;
                    if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
                        this.visualiser.handleExplorationQueryResult(query_result);
                    }
                }
                return result;
            });
        }
    }

    private errNotLoggedIn(): Promise<TypeDBResult<any>> {
        return new Promise((resolve, _reject) => {
            resolve({err: "Not logged in!"})
        });
    }
}
