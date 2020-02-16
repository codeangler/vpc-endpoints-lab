/* Example Test Object / Notification Payload
{
    "RequestType": "Create",
    "ServiceToken": "arn:aws:lambda:us-west-2:503395950200:function:test2-keypairFunction-1O6LK32I10KRY",
    "ResponseURL": "https://cloudformation-custom-resource-response-uswest2.s3-us-west-2.amazonaws.com/arn%3Aaws%3Acloudformation%3Aus-west-2%3A503395950200%3Astack/test2/86ae1c90-00f0-11ea-99e4-064751363480%7Ckeypair%7Cc760998c-cb3d-4aec-a352-7.."
    "RequestId": "c760998c-cb3d-4aec-a352-72e0d8e03b3d",
    "LogicalResourceId": "keypair",
    "ResourceType": "Custom::keypair",
    "ResourceProperties": {
        "ServiceToken": "arn:aws:lambda:us-west-2:503395950200:function:test2-keypairFunction-1O6LK32I10KRY",
        "keypairName": "ee1",
        "Region": "us-east-1"
    }
}
*/
//load the sdk
var AWS = require('aws-sdk');
// Set the region To set the Region in your JavaScript code, 
// update the AWS.Config global configuration object as shown here. 
//AWS.config.update({region: 'us-east-1'});
 AWS.config.update({region: process.env.AWS_REGION });  //set region
// Create EC2 service object
var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
// Create a Secrets Manager client
var ssm = new AWS.SSM({apiVersion: '2016-11-15'});

exports.handler = function(event, context) {
 
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
     
    var responseStatus = "FAILED";
    var responseData = {};
    
    var keyparams = { KeyName: event.ResourceProperties.keypairName, DryRun: false }; 
    var ssmparams = { Name: event.ResourceProperties.keypairName };
    //name keypair based on parameter sent in calling event
    
    // For Delete requests, ec2.deleteKeyPair 
    if (event.RequestType == "Delete") {
        //delete key 
        ec2.deleteKeyPair(keyparams, function(err, data) {
            if (err) {
                responseData = {Error: err};
                responseStatus = "ERROR"
                console.log("Error :", err);
                console.log("Data :", data);
                    } 
            else {
                //construct response
                responseData = {keypairName: event.ResourceProperties.keypairName};
                responseStatus = "SUCCESS"
                console.log("Error :", err);
                console.log("Data :", data);
                }
        //delete associated SSM securestring parameter
        ssm.deleteParameter(ssmparams, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
        //send response
        sendResponse(event, context, responseStatus, responseData);
            });
        return;
    } //end delete use case

    // For Create requests, ec2.createKeyPair 
    if (event.RequestType == "Create") {
        ec2.createKeyPair(keyparams, function(err, data) {
           if (err) {
              responseData = {Error: err};
              responseStatus = "ERROR"
              console.log("Error :", err);
              console.log("Data :", data);
           } 
           else { 
               //construct response
                responseData = {keypairName: event.ResourceProperties.keypairName};
                responseStatus = "SUCCESS"
                console.log("Error :", err);
                console.log("KeyPair Created"); // successful response
                // console.log("Data :", data);
                }
        //create associated SSM securestring parameter
        var keymatterforssm = JSON.stringify(data.KeyMaterial).replace(/['"]+/g, '');
        var ssmcreateparams = {
          Name: event.ResourceProperties.keypairName, /* required */
          Type: 'SecureString', /* required */
          Value: keymatterforssm, /* required */
          Description: 'Key created for vpce lab - pem key enabling ssh access to EC2 instances in lab',
          Overwrite: true, 
          Tier: 'Standard' 
        };
        ssm.putParameter(ssmcreateparams, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log("SSM Parameter Created"); // successful response
                   //console.log(data);           // successful response
        }); 
        //send response
        sendResponse(event, context, responseStatus, responseData);
                });
            return;
        } //end create use case
    
   }; //end handler


// Send response to the pre-signed S3 URL 
function sendResponse(event, context, responseStatus, responseData) {
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });
 
    console.log("RESPONSE BODY:\n", responseBody);
 
    var https = require("https");
    var url = require("url");
 
    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
 
    console.log("SENDING RESPONSE...\n");
 
    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });
 
    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });
  
    // write data to request body
    request.write(responseBody);
    request.end();
}
/* Example Return Notification sent by sendResponse
Send KeyName (without .pem extension) back to the CloudFormation stack so it can be used with the KeyName attributes when EC2 instances are created.
/* RESPONSE BODY:
{
    "Status": "SUCCESS",
    "Reason": "See the details in CloudWatch Log Stream: 2019/11/06/[$LATEST]0a32a2e472014a91827a7be39ea523f9",
    "PhysicalResourceId": "2019/11/06/[$LATEST]0a32a2e472014a91827a7be39ea523f9",
    "StackId": "arn:aws:cloudformation:us-west-2:503395950200:stack/customresourcewalkthrough/6537a860-00d2-11ea-9b37-02578391ed14",
    "RequestId": "acecece9-2056-46d7-a551-43dc63bc051a",
    "LogicalResourceId": "AMIInfo",
    "Data": {
        "Id": "ami-07b629741676653b1"
    }
}
*/
