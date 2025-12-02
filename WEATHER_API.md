# ShoreSquad Weather API Integration

## Overview
ShoreSquad uses the **NEA Realtime Weather API** from Singapore's open data portal (data.gov.sg) to display accurate, real-time 4-day weather forecasts for beach cleanup planning.

## API Details

### Provider
- **National Environment Agency (NEA)**
- **Portal**: https://data.gov.sg
- **License**: Open Data Licence (Free for commercial and personal use)

### API Endpoints

#### 4-Day Weather Forecast
```
https://api.data.gov.sg/v1/environment/4-day-weather-forecast
```
- Returns: 4-day weather forecast for Singapore
- Format: JSON
- Rate Limit: Standard tier (check data.gov.sg for current limits)
- Updates: Frequently throughout the day

#### Realtime Air Temperature
```
https://api.data.gov.sg/v1/environment/air-temperature
```
- Returns: Current air temperature readings from monitoring stations
- Format: JSON
- Geographic Coverage: Multiple stations across Singapore

#### Relative Humidity
```
https://api.data.gov.sg/v1/environment/relative-humidity
```
- Returns: Current humidity levels
- Format: JSON
- Geographic Coverage: Multiple stations across Singapore

### Authentication
- **Status**: No API key required for public access
- **Rate Limits**: Enforced starting 31 December 2025
- **Registration**: Optional - higher rate limits available with registration at data.gov.sg

## Implementation

### Current Implementation
The `WeatherManager` class in `js/app.js` handles:

1. **Data Fetching**
   - Fetches 4-day forecast from NEA API
   - Implements 10-minute caching to reduce API calls
   - Graceful fallback to simulated data on API errors

2. **Response Parsing**
   - Extracts forecast information from NEA API response
   - Maps weather conditions to user-friendly text and emojis
   - Formats dates and times for display

3. **Data Display**
   - Renders 4 weather cards (one per day)
   - Shows day name, date, condition emoji, and forecast text
   - Displays in responsive grid layout

4. **Error Handling**
   - Falls back to cached data if available
   - Uses simulated data as last resort
   - Logs errors for debugging

### Usage

The weather section automatically loads when the page initializes:

```javascript
// In App class init()
const weatherManager = new WeatherManager();
weatherManager.init();
```

The weather data refreshes automatically every 10 minutes:
```javascript
// In WeatherManager.init()
setInterval(() => this.fetchWeather(), CONFIG.WEATHER_CACHE_TIME);
```

## Response Format

### Example NEA 4-Day Forecast Response
```json
{
  "items": [
    {
      "valid_period": {
        "start": "2025-12-02T00:00:00+08:00",
        "end": "2025-12-06T00:00:00+08:00"
      },
      "forecasts": [
        {
          "area": "Singapore",
          "forecast": "Sunny"
        },
        {
          "area": "Singapore",
          "forecast": "Partly cloudy"
        },
        {
          "area": "Singapore",
          "forecast": "Thundery showers"
        },
        {
          "area": "Singapore",
          "forecast": "Rainy"
        }
      ]
    }
  ]
}
```

## Configuration

Located in `CONFIG.API`:

```javascript
const CONFIG = {
    API: {
        WEATHER_REALTIME: 'https://api.data.gov.sg/v1/environment/air-temperature',
        WEATHER_FORECAST: 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast',
        WEATHER_HUMIDITY: 'https://api.data.gov.sg/v1/environment/relative-humidity',
    },
    WEATHER_CACHE_TIME: 600000, // 10 minutes in milliseconds
};
```

## Features

✅ **Real-Time Data**: Live weather data from official NEA sources
✅ **4-Day Forecast**: Extended planning horizon for cleanup events
✅ **Metric Units**: All temperatures in Celsius (metric system)
✅ **Caching**: Reduces API calls and improves performance
✅ **Error Handling**: Graceful fallbacks and error messages
✅ **Accessibility**: Screen reader announcements and semantic HTML
✅ **Responsive Design**: Works on all device sizes
✅ **Emoji Indicators**: Visual weather condition indicators

## Metric Units

All weather data is displayed in metric units:
- **Temperature**: Degrees Celsius (°C)
- **Distance**: Kilometers (km)
- **Humidity**: Percentage (%)

## Troubleshooting

### Weather cards show "Loading..." indefinitely
- Check browser console for errors
- Verify internet connection
- Ensure data.gov.sg APIs are accessible
- Check rate limits haven't been exceeded

### API Error Messages
- **HTTP 429**: Rate limit exceeded - wait before retrying
- **HTTP 401**: Authentication required (register at data.gov.sg)
- **HTTP 503**: Service unavailable - try again later

### Fallback Data
If the API is unavailable, the app displays:
- Cached data if available (up to 10 minutes old)
- Simulated weather data as last resort

## Future Enhancements

- [ ] Add temperature trends (min/max for each day)
- [ ] Include UV index information
- [ ] Add water temperature data
- [ ] Implement location-based forecasts (coastal vs inland)
- [ ] Add wind speed and direction
- [ ] Display air quality (PSI/PM2.5) data
- [ ] Implement push notifications for weather alerts

## Resources

- **NEA Open Data**: https://data.gov.sg/agencies/national-environment-agency-nea
- **Data.gov.sg**: https://data.gov.sg
- **API Documentation**: Available on dataset pages after searching for "NEA Weather"
- **Singapore Weather Info**: https://www.weather.gov.sg

## License

Data provided under the Open Data Licence - free for commercial and personal use.
See: https://data.gov.sg/open-data-licence
