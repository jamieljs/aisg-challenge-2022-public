import { useState } from "react";
import Select from 'react-select'
import { OverallLineChart, OverallDistributionChart, SpecificLineChart, SpecificAgeChart, SpecificGenderChart } from "./homepageCharts";
import { ReloadData } from "./data";

const locationOptions = [ { value: 'location1', label: 'Clementi' }, { value: 'location2', label: 'Pasir Ris' }, { value: 'location3', label: 'Mountbatten' } ];
const durationOptions = [ { value: '1w', label: 'Last 7 days' }, { value: '1d', label: 'Last 24 hours' }, { value: '12h', label: 'Last 12 hours' }, { value: '1h', label: 'Last hour' } ]

const LocationComponent = () => {
  const [locationValue, setLocationValue] = useState(locationOptions[0].value);
  const [locationName, setLocationName] = useState(locationOptions[0].label);

  return (
    <div className="w-75 mx-auto">
      <div className="row my-5">
        <h5 className="col my-auto">Analyse data from a particular advertisement location:</h5>
        <Select
            id="location-select"
            className="col basic-single"
            classNamePrefix="select"
            defaultValue={locationOptions[0]}
            isDisabled={false}
            isLoading={false}
            isClearable={false}
            isRtl={false}
            isSearchable={false}
            name="location-selector"
            options={locationOptions}
            onChange={(newValue) => {
              setLocationName(newValue.label);
              setLocationValue(newValue.value);
            }}
        />
      </div>
      <h3>Number of People Passing By Advertisement at {locationName}</h3>
      <SpecificLineChart locationName={locationName} locationValue={locationValue}/>
      <div className="row mx-auto mt-5">
        <SpecificAgeChart locationName={locationName} locationValue={locationValue}/>
        <SpecificGenderChart locationName={locationName} locationValue={locationValue}/>
      </div>
    </div>
  );
}

const Home = () => {
  const [dataDuration, setDataDuration] = useState(() => durationOptions[0].value);

  ReloadData(dataDuration);

  return (
    <div className="Home">
      <div className="container-fluid col text-center">
        <div className="w-25 mx-auto mb-5">
          This page is displaying data for:
          <Select
            id="duration-select"
            className="basic-single"
            classNamePrefix="select"
            defaultValue={durationOptions[0]}
            isDisabled={false}
            isLoading={false}
            isClearable={false}
            isRtl={false}
            isSearchable={false}
            name="duration-type"
            options={durationOptions}
            onChange = {(newValue) => {
              setDataDuration(newValue.value);
            }}
          />
        </div>
        <div className="w-75 mx-auto">
          <h3>Number of People Passing By All Advertisements</h3>
          <OverallLineChart/>     
          <OverallDistributionChart/>
        </div>
        <div className="row w-25 mx-auto my-5">
          <a href="raw-logs" role="button" className="btn btn-lg btn-primary"><i className="me-2 bi bi-file-earmark-text"></i>View raw logs from PeekingDuck</a>
        </div>

        <hr className="my-5"/>

        <LocationComponent/>
      </div>
    </div>
  );
}

export default Home;