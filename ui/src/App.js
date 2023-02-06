import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './home';
import Logs from './logs';
import AppContext from './AppContext';
import {AccessKey, SecretAccessKey} from "./awsKeys"

function process(j) {
  for (var i = 0; i < j.length; i++) {
    for (var key in j[i]) {
      var str = JSON.stringify(j[i][key]).slice(5, -1);
      if (str.length < 100) {
        str = str.slice(0,-1);
      } else {
        str = str + '...';
      }
      if (str[0] === '"') {
        str = str.slice(1);
      }
      j[i][key] = str;
    }
  }
  return j;
}

function App() {
  const [dbLoad, setDbLoad] = useState(null);

  if (dbLoad === null) {
    const AWS = require("aws-sdk");

    AWS.config.update({
      accessKeyId: AccessKey,
      secretAccessKey: SecretAccessKey,
      region: 'ap-southeast-1'
    });

    const dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

    dynamodb.scan({TableName: "aisgusers"}, function (err, data) {
      if (err) {
        console.error("Error", err);
      } else {
        console.log("Success", data.Items);
        setDbLoad(process(data.Items));
      }
    });
  }
  const userSettings = {
    'dbLoad':dbLoad
  };
  
  return (
    <AppContext.Provider value={userSettings}>
      <Router>
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route path='/raw-logs' element={<Logs />} />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
