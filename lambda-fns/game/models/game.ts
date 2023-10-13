import shortid = require("shortid");

export interface Game {
    id: string;
    state: ("r" | "y" | null)[][];
    isHostsTurn: boolean;
    hostConnection: string;
    opponentConnection?: string;
}

export const gameToJson = (game: Game, addConnections = false) => {
    let json: any = {
        id: game.id,
        state: game.state,
        isHostsTurn: game.isHostsTurn, 
    }

    if (addConnections) {
        json.hostConnection = game.hostConnection;
        json.opponentConnection = game.opponentConnection;
    }

    return json;
}

export const initialiseGame = (connectionId: string): Game => {
    const state = [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
    ];
    return {
        id: shortid.generate(),
        state,
        hostConnection: connectionId,
        isHostsTurn: true
    }
};