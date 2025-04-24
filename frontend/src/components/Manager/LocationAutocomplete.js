import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const LocationAutocomplete = forwardRef(({ label }, ref) => {
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');

  const [countryId, setCountryId] = useState(null);
  const [regionId, setRegionId] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [postalCodeId, setPostalCodeId] = useState(null);

  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [postalCodes, setPostalCodes] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showCountryList, setShowCountryList] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [showPostalList, setShowPostalList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/country')
      .then(res => setCountries(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (countryId) {
      axios.get(`http://localhost:5000/region?countryId=${countryId}`)
        .then(res => setRegions(res.data))
        .catch(console.error);
    } else {
      setRegions([]);
    }
  }, [countryId]);

  useEffect(() => {
    if (regionId) {
      axios.get(`http://localhost:5000/city?regionId=${regionId}`)
        .then(res => setCities(res.data))
        .catch(console.error);
    } else {
      setCities([]);
      setCity('');
      setCityId(null);
    }
  }, [regionId]);

  useEffect(() => {
    if (cityId) {
      axios.get(`http://localhost:5000/postalcodes?cityId=${cityId}`)
        .then(res => setPostalCodes(res.data))
        .catch(console.error);
    } else {
      setPostalCodes([]);
    }
  }, [cityId]);

  useEffect(() => {
    if (postalCodeId) {
      axios.get(`http://localhost:5000/locations-by-postal?postalId=${postalCodeId}`)
        .then(res => setLocations(res.data))
        .catch(console.error);
    } else {
      setLocations([]);
    }
  }, [postalCodeId]);

  const renderSuggestions = (value, list, setValue, setId, idField, nameField, setShow) => {
    const query = value.toLowerCase();
    const filtered = list
      .filter(item => item && typeof item[nameField] === 'string' && item[nameField].toLowerCase().startsWith(query));

    return filtered.length > 0 && (
      <ul className="autocomplete-list">
        {filtered.map((item, i) => (
          <li key={i} onMouseDown={() => {
            setValue(item[nameField]);
            if (setId) setId(item[idField]);
            setShow(false);
          }}>
            {item[nameField]}
          </li>
        ))}
      </ul>
    );
  };

  useImperativeHandle(ref, () => ({
    getLocationData: () => ({
      country, region, city, postalCode, address
    })
  }));

  return (
    <div className="location-autocomplete">
      <h4>{label}</h4>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Країна"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setShowCountryList(true);
          }}
          onBlur={() => setTimeout(() => setShowCountryList(false), 200)}
        />
        {showCountryList && renderSuggestions(country, countries, setCountry, setCountryId, 'CountryId', 'CountryName', setShowCountryList)}
      </div>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Регіон"
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setShowRegionList(true);
          }}
          onBlur={() => setTimeout(() => setShowRegionList(false), 200)}
        />
        {showRegionList && renderSuggestions(region, regions, setRegion, setRegionId, 'RegionId', 'RegionName', setShowRegionList)}
      </div>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Місто"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setShowCityList(true);
          }}
          onBlur={() => setTimeout(() => setShowCityList(false), 200)}
        />
        {showCityList && renderSuggestions(city, cities, setCity, setCityId, 'CItyId', 'CityName', setShowCityList)}
      </div>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Поштовий індекс"
          value={postalCode}
          onChange={(e) => {
            setPostalCode(e.target.value);
            setShowPostalList(true);
          }}
          onBlur={() => setTimeout(() => setShowPostalList(false), 200)}
        />
        {showPostalList && renderSuggestions(postalCode, postalCodes, setPostalCode, setPostalCodeId, 'PostalCodeId', 'PostalCodeName', setShowPostalList)}
      </div>

      <div className="autocomplete">
        <input
          type="text"
          placeholder="Адреса"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setShowLocationList(true);
          }}
          onBlur={() => setTimeout(() => setShowLocationList(false), 200)}
        />
        {showLocationList && renderSuggestions(address, locations, setAddress, null, 'LocationId', 'Address', setShowLocationList)}
      </div>
    </div>
  );
});

export default LocationAutocomplete;
