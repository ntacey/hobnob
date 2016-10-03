var AWS = require("aws-sdk");
var context = require("../context");

AWS.config.update({
    region: context.aws_data.region,
    endpoint: context.aws_data.endpoint
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "texts",
    KeySchema: [       
        { AttributeName: "sid", KeyType: "HASH" },  //Partition key
        { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "text_id", AttributeType: "N" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 5
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
//http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.01.html