import React, { useState } from "react";
import Select from 'react-select'
import 'chart.js/auto'
import { GetOverallLineData, GetOverallDistributionData, GetLineData, GetAgeData, GetGenderData } from "./data";
import { Doughnut, Line } from "react-chartjs-2";

const distriOptions = [ { value: 'age', label: 'By Age' }, { value: 'gender', label: 'By Gender' }, { value: 'location', label: 'By Location' } ];

const donutOptions = {
  //maintainAspectRatio: false,
  plugins: {
    title: {
      display: false
    },
    legend: {
      display: true
    }
  }
};
const stackedAreaOptions = {
  //maintainAspectRatio: false,
  plugins: {
    title: {
      display: false
    },
    legend: {
      display: true
    }
  },
  scales: {
    y: {
        stacked: true
    }
  }
};

const OverallLineChart = () => {
  return (
    <Line
      data={GetOverallLineData()}
      options={stackedAreaOptions}
      height="auto"
      width="auto"
    />
  );
}

const OverallDistributionChart = () => {
  const [overallDistributionType, setOverallDistributionType] = useState('age');
  const [overallLooking, setOverallLooking] = useState(false);
  const [overallNorm, setOverallNorm] = useState(false);

  return (
    <div className="w-50 mx-auto mt-5">
      <h3>Distribution of People Passing By All Advertisements</h3>
      <Select
        id="distribution-select"
        className="basic-single"
        classNamePrefix="select"
        defaultValue={distriOptions[0]}
        isDisabled={false}
        isLoading={false}
        isClearable={false}
        isRtl={false}
        isSearchable={false}
        name="distribution-type"
        options={distriOptions}
        onChange = {(newValue) => {
          setOverallDistributionType(newValue.value);
//          setOverallDistributionData(GetOverallDistributionData(overallLooking, newValue.value, overallNorm));
          var normLabel = document.getElementById("overall-normalise-label");
          if (newValue.value === "age") {
            normLabel.removeAttribute("style");
          } else {
            normLabel.setAttribute("style", "display:none;");
          }
        }}
      />
      <label htmlFor="overall-looking" className="mt-2">
        <input className="me-2" type="checkbox" value="" id="overall-looking"
          onChange={(e) => {
            setOverallLooking(e.target.checked);
//            setOverallDistributionData(GetOverallDistributionData(e.target.checked, overallDistributionType, overallNorm));
          }}
        />
        Only count people who have looked at the advertisement
      </label>
      <label htmlFor="overall-normalise" className="mt-2" id="overall-normalise-label">
        <input className="me-2" type="checkbox" value="" id="overall-normalise"
          onChange={(e) => {
            setOverallNorm(e.target.checked);
//            setOverallDistributionData(GetOverallDistributionData(overallLooking, overallDistributionType, e.target.checked));
          }}
        />
        Normalise ages (i.e. take percentage with respect to nation's population size of that age group, in order to correct for uneven age distribution within the entire population)
      </label>

      <Doughnut 
        className="mt-4"
        data={GetOverallDistributionData(overallLooking, overallDistributionType, overallNorm)}
        options={donutOptions}
        height="auto"
        width="auto"
      />
    </div>
  );
}

const SpecificLineChart = ({locationName, locationValue}) => {
  return (
    <Line
      data={GetLineData(locationValue)}
      options={stackedAreaOptions}
      height="auto"
      width="auto"
    />
  );
}

const SpecificAgeChart = ({locationName, locationValue}) => {
  const [specificLooking, setSpecificLooking] = useState(false);
  const [specificNorm, setSpecificNorm] = useState(false);

  return (
    <div className="col mx-auto">
      <h3>Age Distribution of People Passing By Advertisement at {locationName}</h3>
      <label htmlFor="specific-looking" className="mt-2">
        <input className="me-2" type="checkbox" value="" id="specific-looking"
          onChange={(e) => {
            setSpecificLooking(e.target.checked);
//            setAgeData(GetAgeData(locationValue, e.target.checked, specificNorm));
          }}
        />
        Only count people who have looked at the advertisement
      </label>
      <label htmlFor="specific-normalise" className="mt-2" id="specific-normalise-label">
        <input className="me-2" type="checkbox" value="" id="specific-normalise"
          onChange={(e) => {
            setSpecificNorm(e.target.checked);
//            setAgeData(GetAgeData(locationValue, specificLooking, e.target.checked));
          }}
        />
        Normalise ages (i.e. take percentage with respect to nation's population size of that age group, in order to correct for uneven age distribution within the entire population)
      </label>

      <Doughnut 
        className="mt-4"
        data={GetAgeData(locationValue, specificLooking, specificNorm)}
        options={donutOptions}
        height="auto"
        width="auto"
      />
    </div>
  );
}

const SpecificGenderChart = ({locationName, locationValue}) => {
  const [specificLookingGender, setSpecificLookingGender] = useState(false);

  return (
    <div className="col mx-auto">
      <h3>Gender Distribution of People Passing By Advertisement at {locationName}</h3>
      <label htmlFor="specific-looking-gender" className="mt-2">
        <input className="me-2" type="checkbox" value="" id="specific-looking-gender"
          onChange={(e) => {
            setSpecificLookingGender(e.target.checked);
//            setGenderData(GetGenderData(locationValue, e.target.checked));
          }}
        />
        Only count people who have looked at the advertisement
      </label>
      <label htmlFor="specific-normalise-gender" className="mt-2" id="specific-normalise-gender-label" style={{visibility: "hidden"}}>
        <input className="me-2" type="checkbox" value="" id="specific-normalise-gender" />
        Normalise ages (i.e. take percentage with respect to nation's population size of that age group, in order to correct for uneven age distribution within the entire population)
      </label>

      <Doughnut 
        className="mt-4"
        data={GetGenderData(locationValue, specificLookingGender)}
        options={donutOptions}
        height="auto"
        width="auto"
      />
    </div>
  );
}

export {OverallLineChart, OverallDistributionChart, SpecificLineChart, SpecificAgeChart, SpecificGenderChart};