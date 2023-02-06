import React, { useState, useEffect } from "react";
import {AccessKey, SecretAccessKey} from "./awsKeys"

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: AccessKey,
  secretAccessKey: SecretAccessKey,
  region: 'ap-southeast-1'
});

const dynamodocclient = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

const Table = ({theadData, tbodyData}) => {
    return (
        <table>
            <thead>
                <tr>
                    {theadData.map((heading, index)=> {
                        if (heading !== 'dummy') {
                            return <th key={index}>{heading}</th>
                        }
                        return null;
                    })}
                </tr>
            </thead>
            <tbody>
                {tbodyData.map((row, index) => {
                    return <tr key={index}>
                        {theadData.map((key, index) => {
                            if (key !== 'dummy') {
                                return <td key={index}>{row[key]}</td>
                            }
                            return null;
                        })}
                    </tr>;
                })}
            </tbody>
        </table>
    );
}

const Logs = () => {
    const [logs, setLogs] = useState([{'loading...':'please be patient'}]);
    const [users, setUsers] = useState([{'loading...':'please be patient'}]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        dynamodocclient.query({TableName: "aisglogs",  IndexName: "dummy-index", KeyConditionExpression: "dummy = :a", ExpressionAttributeValues: {':a': "help"}, Limit: '15', ScanIndexForward: false}, function (err, data) {
            if (err) {
              console.error("Error", err);
            } else {
              console.log("Success");
              setLogs(data.Items);
            }
        });
        dynamodocclient.query({TableName: "aisgusers", IndexName: "dummy-index", KeyConditionExpression: "dummy = :a", ExpressionAttributeValues: {':a': "help"}, Limit: '15', ScanIndexForward: false}, function (err, data) {
            if (err) {
                console.error("Error", err);
            } else {
                console.log("Success");
                setUsers(data.Items);
            }
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }, []);

    var proc_url = s3.getSignedUrl('getObject', {'Bucket': 'aisgpics', 'Key': 'proc_img.png'});
    var raw_url = s3.getSignedUrl('getObject', {'Bucket': 'aisgpics', 'Key': 'raw_img.png'});
    
    return (
      <div className="Logs">
        <div className="container-fluid col text-center">
            <div className="row mx-auto mb-5">
                <img className="w-50" src={proc_url} alt="processed footage"/>
                <img className="w-50" src={raw_url} alt="processed footage"/>
            </div>
            <h2>User Information Derived from Logs (last 15 items)</h2>
            <div className="row text-start my-5">
                <Table theadData={Object.keys(users[0])} tbodyData={users}/>
            </div>
            <h2>Logs from PeekingDuck (last 15 items)</h2>
            <div className="row text-start my-5">
                <Table theadData={Object.keys(logs[0])} tbodyData={logs}/>
            </div>
        </div>
      </div>
    );
}

export default Logs;