import { Action } from './action'

export interface Message {
    action: Action;
    data?: {
        gameId: string;
        x?: number;
        y?: number;
    }
};