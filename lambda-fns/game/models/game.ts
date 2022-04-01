import shortid = require("shortid");

export class Game {
    id: string;
    state: (string | null)[][] = [];
    isHostsTurn: boolean = false;
    hostConnection: string;
    opponentConnection: string;

    initialise(connectionId: string) {
        this.initialiseState();
        this.hostConnection = connectionId;
        this.id = shortid.generate();
    }

    private initialiseState() {
        this.state = [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
        ]
    }

    toJson(addConnections = false) {
        let json: any = {
            id: this.id,
            state: this.state,
            isHostsTurn: this.isHostsTurn, 
        }

        if (addConnections) {
            json.hostConnection = this.hostConnection;
            json.opponentConnection = this.opponentConnection;
        }

        return json;
    }

    mapFromObject(json: any): Game {
        this.id = json.id;
        this.state = json.state;
        this.isHostsTurn = json.isHostsTurn;
        this.hostConnection = json.hostConnection;
        this.opponentConnection = json.opponentConnection;

        return this;
    }
}