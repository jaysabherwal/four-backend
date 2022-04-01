import { DocumentClient } from "aws-sdk/clients/dynamodb";

export const retrieve = async (gameId: string, ddb: DocumentClient, tableName: string) => {
    const params = {
        Key: {
            "GameId": gameId
        },
        TableName: tableName
    };

    return ddb.get(params).promise();
};

export const update = (items: any, gameId: string, ddb: DocumentClient, tableName: string) => {

    const updateDetails = buildUpdateDetails(items);

    const putParams = {
        Key: {
            "GameId": gameId
        },
        UpdateExpression: `set ${updateDetails.str}`,
        ExpressionValueAttributes: updateDetails.valuesObj,
        TableName: tableName,
        ReturnValues: "UPDATED_NEW"
    };

    return ddb.update(putParams).promise();
};

const buildUpdateDetails = (items: any) => {
    let arr = items.map((item: any, index: number) => {
        return `${item.key} = :${index}`;
    });

    let values: any = {};

    items.forEach((item: any, index: number) => {
        values[`:${index}`] = item.value;
    });

    return {
        str: arr.join(", "),
        valuesObj: values
    }
};