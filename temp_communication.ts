

// let token = await login("http://127.0.0.1:8000", "admin", "password");
export async function core_driver(address: string, username: string, password: string) : Promise<CoreDriver> {
    let response = await fetch(address + "/v1/signin", {
        method: "POST",
        body: JSON.stringify({
          username: username,
          password: password,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });     

    return new CoreDriver(await response.text());
}

type TypeDBJSONResponse = {
    // todo
};

class CoreDriver {
    token : string;

    constructor(token: string) {
        this.token = token;
    }

    run_query(query:string) : TypeDBJSONResponse {
        let response_text = "{}";
        return JSON.parse(response_text) as TypeDBJSONResponse;
    }
}
