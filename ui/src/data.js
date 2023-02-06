import {AccessKey, SecretAccessKey} from "./awsKeys"
import AppContext from './AppContext';
import { useContext } from "react";

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: AccessKey,
  secretAccessKey: SecretAccessKey,
  region: 'ap-southeast-1'
});

var Data = [];
var LineData = []; // timestamp, nlook1, nlook2, nlook3, looking1, looking2, looking3
var LocData = []; // nlook1, nlook2, nlook3, looking1, looking2, looking3
var AgeData = []; // id, age group, nlook1, nlook2, nlook3, looking1, looking2, looking3 (8 entries)
var GenderData = []; // gender, nlook1, nlook2, nlook3, looking1, looking2, looking3 (2 entries)
const SgAgeDistri = [140440, 158381, 283003, 440052, 597235, 590852, 597301, 1243033];
const AgeGroups = ['(0-3)', '(4-7)', '(8-14)', '(15-24)', '(25-34)', '(35-44)', '(45-54)', '(55+)'];
const CamIds = ['s1n0w7ow13', 'a1l91i2en4', '2h11h8p4ix'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const hoursToAdd = {'1w':168,'1d':24,'12h':12,'1h':1};
const timeUnitsToAdd = {'1w':7,'1d':24,'12h':12,'1h':12};
const timeSkips = {'1w':86400000,'1d':3600000,'12h':3600000,'1h':300000};

function ReloadData(dataDuration) {
  const myContext = useContext(AppContext);

  if (myContext.dbLoad === null) return;
  let d = myContext.dbLoad;
  
  var timestamp = null;
  Data = [];
  var now = new Date();
  for (let i = 0; i < d.length; i++) {
    timestamp = new Date(d[i]['Timestamp']).getTime();
    let temp = timestamp;
    timestamp = new Date(timestamp + hoursToAdd[dataDuration]*3600000);
    if (timestamp.getTime() >= now.getTime()) {
      Data.push(d[i]);
      Data[Data.length-1]['Timestamp'] = temp;
    }
  }
  LineData = [];
  AgeData = [];
  GenderData = [];
  for (let j = timeUnitsToAdd[dataDuration]; j >= 1; j--) {
    LineData.push({'timestamp': new Date(now.getTime() - (j-0.5)*timeSkips[dataDuration]), 'nlook1': 0, 'nlook2': 0, 'nlook3': 0, 'looking1': 0, 'looking2': 0, 'looking3': 0});
  }
  LocData = [0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 8; j++) {
    AgeData.push({'id': j, 'ageGroup': AgeGroups[j], 'nlook1': 0, 'nlook2': 0, 'nlook3': 0, 'looking1': 0, 'looking2': 0, 'looking3': 0});
  }
  GenderData.push({'gender': 'Male', 'nlook1': 0, 'nlook2': 0, 'nlook3': 0, 'looking1': 0, 'looking2': 0, 'looking3': 0});
  GenderData.push({'gender': 'Female', 'nlook1': 0, 'nlook2': 0, 'nlook3': 0, 'looking1': 0, 'looking2': 0, 'looking3': 0});
  for (let i = 0; i < Data.length; i++) {
    timestamp = Data[i]['Timestamp'];
    for (let j = 1; j <= timeUnitsToAdd[dataDuration]; j++) {
      if (timestamp + j*timeSkips[dataDuration] >= now.getTime()) {
        for (let k = 1; k <= 3; k++) {
          if (Data[i]['CameraId'] === CamIds[k-1]) {
            var lookString = 'looking';
            if (Data[i]['PositiveFrames'] > 0) {
              LocData[2+k]++;
            } else if (Data[i]['TotalFrames'] > 0) {
              lookString = 'nlook';
              LocData[k-1]++;
            }
            LineData[timeUnitsToAdd[dataDuration]-j][lookString+k]++;
            for (var l = 0; l < 8; l++) {
              if (Data[i]['Age'] === AgeGroups[l]) {
                AgeData[l][lookString+k]++;
              }
            }
            switch(Data[i]['Gender']){
              case 'Male':
                GenderData[0][lookString+k]++;
                break;
              default:
                GenderData[1][lookString+k]++;
            }
            break;
          }
        }
        break;
      }
    }
  }
}

function GetOverallLineData() {
  return {labels: LineData.map((data) => {
      let date = data.timestamp;
      return monthNames[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
    }), 
    datasets: [
      {
        label: "Looking",
        data: LineData.map((data) => data.looking1 + data.looking2 + data.looking3),
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderColor: 'green',
        borderWidth: 1,
        fill: {
          target: 'origin',
          above: 'rgba(0, 255, 0, 0.3)'
        }
      },
      {
        label: "Not Looking",
        data: LineData.map((data) => data.nlook1 + data.nlook2 + data.nlook3),
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderColor: 'red',
        borderWidth: 1,
        fill: {
          target: '-1',
          above: 'rgba(255, 0, 0, 0.3)'
        }
      }
    ]
  };
}

function GetOverallDistributionData(looking=false, type="location", normalise=false) { 
  switch(type) {
    case "location":
      return {
        labels: ['Clementi', 'Pasir Ris', 'Mountbatten'], 
        datasets: [
          {
            label: "Viewers",
            data: [LocData[0] + LocData[3], LocData[1] + LocData[4], LocData[2] + LocData[5]],
            backgroundColor: [
              "rgba(255, 0, 0, 0.4)",
              "rgba(255, 0, 255, 0.4)",
              "rgba(0, 0, 255, 0.4)",
            ],
            borderColor: "black",
            borderWidth: 2
          }
        ]
      };
    case "age":
      return {
        labels: AgeData.map((data) => data.ageGroup), 
        datasets: [
          {
            label: "Viewers",
            data: AgeData.map((data) => {
              let sum = data.looking1 + data.looking2 + data.looking3 + (looking ? 0 : data.nlook1 + data.nlook2 + data.nlook3);
              if (normalise) {
                return sum / SgAgeDistri[data.id];
              }
              return sum;
            }),
            backgroundColor: [
              "rgba(255, 0, 0, 0.4)",
              "rgba(255, 0, 85, 0.4)",
              "rgba(255, 0, 170, 0.4)",
              "rgba(255, 0, 255, 0.4)",
              "rgba(170, 0, 255, 0.4)",
              "rgba(85, 0, 255, 0.4)",
              "rgba(0, 0, 255, 0.4)",
              "rgba(0, 85, 255, 0.4)"
            ],
            borderColor: "black",
            borderWidth: 2
          }
        ]
      };
    case "gender":
      return {
        labels: GenderData.map((data) => data.gender), 
        datasets: [
          {
            label: "Viewers",
            data: GenderData.map((data) => (data.looking1 + data.looking2 + data.looking3 + (looking ? 0 : data.nlook1 + data.nlook2 + data.nlook3))),
            backgroundColor: [
              "rgba(0, 0, 255, 0.3)",
              "rgba(255, 0, 0, 0.3)"
            ],
            borderColor: "black",
            borderWidth: 2
          }
        ]
      };
    default:
      return null;
  }
}

function GetLineData(location) {
  return {labels: LineData.map((data) => {
      let date = data.timestamp;
      return monthNames[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
    }), 
    datasets: [
      {
        label: "Looking",
        data: LineData.map((data) => {
          switch(location) {
            case "location1":
              return data.looking1;
            case "location2":
              return data.looking2;
            default:
              return data.looking3;
          }
        }),
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderColor: 'green',
        borderWidth: 1,
        fill: {
          target: 'origin',
          above: 'rgba(0, 255, 0, 0.3)'
        }
      },
      {
        label: "Not Looking",
        data: LineData.map((data) => {
          switch(location) {
            case "location1":
              return data.nlook1;
            case "location2":
              return data.nlook2;
            default:
              return data.nlook3;
          }
        }),
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderColor: 'red',
        borderWidth: 1,
        fill: {
          target: '-1',
          above: 'rgba(255, 0, 0, 0.3)'
        }
      }
    ]
  };
}

function GetAgeData(location=null, looking=false, normalise=false) {
  return {
    labels: AgeData.map((data) => data.ageGroup), 
    datasets: [
      {
        label: "Viewers",
        data: AgeData.map((data) => {
          var sum = 0;
          switch(location) {
            case "location1":
              sum = data.looking1 + (looking ? 0 : data.nlook1);
              break;
            case "location2":
              sum = data.looking2 + (looking ? 0 : data.nlook2);
              break;
            default:
              sum = data.looking3 + (looking ? 0 : data.nlook3);
          }
          if (normalise) {
            return sum / SgAgeDistri[data.id];
          }
          return sum;
        }),
        backgroundColor: [
          "rgba(255, 0, 0, 0.4)",
          "rgba(255, 0, 85, 0.4)",
          "rgba(255, 0, 170, 0.4)",
          "rgba(255, 0, 255, 0.4)",
          "rgba(170, 0, 255, 0.4)",
          "rgba(85, 0, 255, 0.4)",
          "rgba(0, 0, 255, 0.4)",
          "rgba(0, 85, 255, 0.4)"
        ],
        borderColor: "black",
        borderWidth: 2
      }
    ]
  };
}

function GetGenderData(location=null, looking=false) {
  return {
    labels: GenderData.map((data) => data.gender), 
    datasets: [
      {
        label: "Viewers",
        data: GenderData.map((data) => {
          switch(location) {
            case "location1":
              return data.looking1 + (looking ? 0 : data.nlook1);
            case "location2":
              return data.looking2 + (looking ? 0 : data.nlook2);
            default:
              return data.looking3 + (looking ? 0 : data.nlook3);
          }
        }),
        backgroundColor: [
          "rgba(0, 0, 255, 0.3)",
          "rgba(255, 0, 0, 0.3)"
        ],
        borderColor: "black",
        borderWidth: 2
      }
    ]
  };
}

export {ReloadData, GetOverallLineData, GetOverallDistributionData, GetLineData, GetAgeData, GetGenderData};