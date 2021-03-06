// model for current day weather
let weatherModel = [];
// model for 5 day forecast 
let weatherModel5 = [];
//model for location features
var geoLocation = [];

// on-load function to set default city
// need to trigger apiCall
// need to check if local storage has any value stored for default city
$(document).ready(function () {
    if (localStorage.defaultCity != undefined) {
        apiCall(localStorage.defaultCity)
    } else {
        return
    }
});

// search button event listener. city search
$('#search').click(function () {
    let searchValue = $('#searchInput').val();
    // check for empty search bar
    if (searchValue.length > 0) {
        apiCall(searchValue)
    } else {
        alert('search bar can not be left empty before submitting')
    }
})
// event listener for dynaicaly created button (set default city)
// function to set default city in the local storage
$(document).on('click', '.mainWeather', function () {
    let defaultCity = weatherModel[0].cityName;
    setDefaultCity(defaultCity);
})

// button listener for "get Location" feature
$('#location').click(function () {
    locationCall();
})

//local storage feature for saving favorite city
const setDefaultCity = function (defaultCity) {
    localStorage.setItem('defaultCity', defaultCity)
    renderView(weatherModel)
}

// API call for current weather with key
// key  096f3282b86fa805756f58092f5d2481----4102008879dcae5fa2ce2d42e5bf66ba
var apiCall = function (searchVal) {
    weatherModel = [];
    setTimeout(function () {
        $.ajax({
            method: "GET",
            url: "https://api.openweathermap.org/data/2.5/weather?q=" + searchVal + "&APPID=096f3282b86fa805756f58092f5d2481",
            dataType: "json",

            success: function (data) {
                // console.log('temperature ', data.main.temp) // kalvin to F  (280.24K − 273.15) × 9/5 + 32 = 44.762°F
                // console.log('icon search ', data.weather[0].icon)

                // data returned from APi call to be filtered -> filteredData
                filteredData(data);
                apiCallFiveDay(searchVal)
                renderView(weatherModel)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                if (errorThrown == "Not Found") {
                    alert('City not found. Please try another city')
                } else {
                    console.log('error returned ', jqXHR, textStatus);
                    alert('system error ', textStatus)
                }
            }
        });
    }, 0);
};

// need API call for 5 days weather
var apiCallFiveDay = function (searchVal) {

    weatherModel5 = [];
    setTimeout(function () {
        $.ajax({
            method: "GET",
            url: "http://api.openweathermap.org/data/2.5/forecast?appid=096f3282b86fa805756f58092f5d2481&q=" + searchVal + "&units=imperial",
            dataType: "json",

            success: function (dataFive) {
                // console.log('inside five call!! ', dataFive)
                // creating variables to pass in to locationCall -- to show map and pin on the map
                let currentLatitude = dataFive.city.coord.lat;
                let currentLongitude = dataFive.city.coord.lon;
                let cityName = dataFive.city.name;

                filterFiveDay(dataFive)
                //renderView(weatherModel)
                locationCallForCurrentSearch(currentLatitude, currentLongitude, cityName);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
            }
        });
    }, 0);
};

// need function to convert kalvin to farenhaight 
var kelvinToFar = function (temp) {
    return parseInt((temp - 273.15) * 9 / 5 + 32) // kalvin to F  (280.24K − 273.15) × 9/5 + 32 = 44.762°F
};

// way to store returned information and Model set up for separate call later that updates view
const filteredData = function (mainData) {
    // console.log('filter data mainData ', mainData.sys.country)
    var weatherObj = {};
    weatherObj["weather"] = mainData.weather[0].description;
    weatherObj["cityName"] = mainData.name;
    weatherObj["country"] = mainData.sys.country;
    weatherObj["temperature"] = kelvinToFar(mainData.main.temp);
    weatherObj["icon"] = "http://openweathermap.org/img/wn/" + mainData.weather[0].icon + "@2x.png";

    weatherModel.push(weatherObj);
    console.log('weather model inside filteredData ', weatherModel)
}
// function to sort out information and get only the one to display for 5 day forecast
const filterFiveDay = function (dataFive) {

    var dataTemp = [];
    //added for loop to get same time of the day for each day in 5 day foprecats display
    for (var a = 0; a < dataFive.list.length; a = (a + 8)) {
        // console.log('inside five day filter ', dataFive.list[a])
        dataTemp.push(dataFive.list[a])
    };
    // console.log('inside filter5 ', weatherObjFive)
    for (var i = 0; i < dataTemp.length; i++) {
        var weatherObjFive = {};
        weatherObjFive["time5"] = getDay(dataTemp[i].dt_txt);
        weatherObjFive["temperature5"] = dataTemp[i].main.temp;
        weatherObjFive["weather5"] = dataTemp[i].weather[0].main;
        weatherObjFive["icon5"] = "http://openweathermap.org/img/wn/" + dataTemp[i].weather[0].icon + "@2x.png";

        weatherModel5.push(weatherObjFive);
    }
    renderViewFive(weatherModel5)
};
// render function to display five day forecast
let renderViewFive = function (weatherModel5) {
    $('#five-day').empty();
    for (var i = 0; i < weatherModel5.length; i++) {
        var source = $('#five-template').html();
        var template = Handlebars.compile(source);
        var newHTML = template(weatherModel5[i]);
        $('#five-day').append(newHTML);
    }
    // console.log('inside renderWievFive weatherModel5 ', weatherModel5)
}
// function or call to display information to view for single day
let renderView = function (weatherModel) {
    $('.mainWeather').empty();
    // console.log('renderView mainData value ', weatherModel[0].cityName)
    for (var i = 0; i < weatherModel.length; i++) {
        var source = $('#main-template').html();
        var template = Handlebars.compile(source);
        var newHTML = template(weatherModel[i]);
        $('.mainWeather').append(newHTML);
    }
    // set show and hide for default city
    if (localStorage.defaultCity != weatherModel[0].cityName) {
        // boothstrap classes to set hidden and show elements
        $('#DefCityMessage').addClass("d-block");
        $('#DefCitySet').addClass("d-none");
    } else {
        $('#DefCitySet').addClass("d-block");
        $('#DefCityMessage').addClass("d-none");
    }
};

// create function to convert date from API to current day.
// date formating, find day of the week
const getDay = function (dateToConvert) {

    var gsDayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wed',
        'Thursday',
        'Friday',
        'Saturday'
    ];

    var d = new Date(dateToConvert);
    var dayName = gsDayNames[d.getDay()];
    //getDay will return the name of day
    return dayName
};

// google maps API key   "key=API_KEY"--AIzaSyBjunVQe2A8mt0sISCk88UOztGzh7D-OJw
// geolocation function need to get current location 
// geoLocation varible created and placed on top with global variables
var map;
var locationCall = function () {
    var gps = navigator.geolocation.getCurrentPosition(
        function (position) {

            geoLocation.push(position.coords.latitude);
            geoLocation.push(position.coords.longitude)

            console.log('GeoPosition ', geoLocation)
            let latitude = geoLocation[0];
            let longitude = geoLocation[1]
            // new map to render on view
            function initMap() {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: {
                        lat: latitude,
                        lng: longitude
                    },
                    zoom: 13
                });
                // pin for "get Location" need to pass data from geolocation to marker 
                var marker = new google.maps.Marker({
                    position: {
                        lat: latitude,
                        lng: longitude
                    },
                    map: map,
                });
            }
            initMap();
            apiCallCoordinates(latitude, longitude)
        })
};
// call for current "searched" location from search button
var locationCallForCurrentSearch = function (latitude, longitude, cityName) {
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: latitude,
                lng: longitude
            },
            zoom: 9
        });
        // pin feature, pass data from weather API call for 5 days in to map
        var marker = new google.maps.Marker({
            position: {
                lat: latitude,
                lng: longitude
            },
            map: map,
            title: cityName
        });
    }
    initMap();
};
// get local coordinates Lat and Lomg from "get Location" 
// will need another call from weather API
// this API call is for Get Location button. Separate call using latitude and longitude based on user location
var apiCallCoordinates = function (latitude, longitude) {
    weatherModel = [];
    setTimeout(function () {
        $.ajax({
            method: "GET",
            url: "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&APPID=096f3282b86fa805756f58092f5d2481",
            dataType: "json",
            // api.openweathermap.org/data/2.5/forecast?lat=35&lon=139
            success: function (data) {
                // console.log('temperature ', data.main.temp) // kalvin to F  (280.24K − 273.15) × 9/5 + 32 = 44.762°F
                console.log('location name ', data.name)

                // data returned from APi call to be filtered -> filteredData
                filteredData(data);
                apiCallFiveDay(data.name)
                renderView(weatherModel)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                if (errorThrown == "Not Found") {
                    alert('location not found. Please try another city')
                } else {
                    console.log('error returned ', jqXHR, textStatus);
                    alert('system error ', textStatus)
                }
            }
        });
    }, 0);
};